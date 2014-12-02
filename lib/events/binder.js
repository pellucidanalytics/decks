var _ = require("lodash");
var Emitter = require("./emitter");
var validate = require("../utils/validate");
var browser = require("../utils/browser");

/**
 * Mixin for objects that need to bind to events from a source object,
 * and wish to handle events with member functions.
 *
 * @mixin
 */
var binder = {
  /**
   * Binds events from the source object to a handler method on 'this' object.
   * The handler method is automatically bound to 'this', and stored on 'this' using
   * a prefixed method name, based on the original method name.
   *
   * @instance
   * @param {!*} source object which emits an event, and can be subscribed to.
   * @param {!Object} eventToMethodMap hash of event name to method name of this.
   * @return {undefined}
   */
  bindEvents: function(source, eventToMethodMap) {
    validate(source, "source", { isRequired: true });
    validate(eventToMethodMap, "eventToMethodMap", { isRequired: true });

    _.each(eventToMethodMap, function(methodName, eventName) {
      if (!_.isFunction(this[methodName])) {
        throw new Error("binder#bindEvents: event target object does not have a method named " + methodName);
      }

      var eventNames = this.getEventNames(eventName);

      _.each(eventNames, function(eventName) {
        var onMethodName = this.getOnMethodName(source);

        if (source instanceof Emitter) {
          // Assuming the on method supports a context arg, so we don't need to _.bind the method
          source[onMethodName](eventName, this[methodName], this);
        } else {
          // Not assuming the on method supports a context arg, so we need to _.bind the method
          var boundMethodName = this.getBoundMethodName(methodName);
          if (!_.isFunction(this[boundMethodName])) {
            this[boundMethodName] = _.bind(this[methodName], this);
          }

          // IE8 prefixes the event name with "on"
          if (onMethodName === "attachEvent") {
            eventName = "on" + eventName;
          }

          source[onMethodName](eventName, this[boundMethodName]);
        }
      }, this);
    }, this);
  },

  /**
   * Unbinds from events from a given source object, which were previously bound using bindEvents.
   *
   * @instance
   * @param {!*} source source object that emits events
   * @param {!Object} eventToMethodMap hash of event names to method names of 'this'
   * @return {undefined}
   */
  unbindEvents: function(source, eventToMethodMap) {
    validate(source, "source", { isRequired: true });
    validate(eventToMethodMap, "eventToMethodMap", { isRequired: true });

    _.each(eventToMethodMap, function(methodName, eventName) {
      var eventNames = this.getEventNames(eventName);

      _.each(eventNames, function(eventName) {
        var offMethodName = this.getOffMethodName(source, eventName);

        if (source instanceof Emitter) {
          // Assuming the off method supports a context arg, so we don't need to _.bind the method
          source[offMethodName](eventName, this[methodName], this);
        } else {
          // Not assuming the off method supports a context arg, get the _.bind copy of the method
          var boundMethodName = this.getBoundMethodName(methodName);

          if (!this[boundMethodName]) {
            return;
          }

          // IE8 prefixes event names with "on" (e.g. onmouseup)
          if (offMethodName === "detachEvent") {
            eventName = "on" + eventName;
          }

          source[offMethodName](eventName, this[boundMethodName]);
        }
      }, this);
    }, this);
  },

  /**
   * Tries to find a method on the source object which can be used to bind events.
   *
   * @instance
   * @param {!*} source object that emits events
   * @return {String} first method name that could be used to bind events.
   */
  getOnMethodName: function(source) {
    var name = _.find(["on", "addListener", "addEventListener", "attachEvent"], function(name) {
      // "attachEvent" is not a "function" in IE8 (WTF)
      return _.isFunction(source[name]) || (browser.isIE8 && source[name]);
    });

    if (!name) {
      throw new Error("binder#getOnMethodName: event source object does not have an event binding method");
    }

    return name;
  },

  /**
   * Tries to find a method on the source object which can be used to unbind events.
   *
   * @instance
   * @param {!*} source object which emits events
   * @return {String} first method name that could be used to unbind events.
   */
  getOffMethodName: function(source) {
    var name = _.find(["off", "removeListener", "removeEventListener", "detachEvent"], function(name) {
      // "detachEvent" is not a "function" in IE8 (WTF)
      return _.isFunction(source[name]) || (browser.isIE8 && source[name]);
    });

    if (!name) {
      throw new Error("binder#getOffMethodName: event source object does not have an event unbinding method");
    }

    return name;
  },

  /**
   * Splits an event name by " " into possibly multiple event names
   *
   * @instance
   * @param {String} eventName - single or space-delimited event name(s)
   * @return {String[]} - array of event names
   */
  getEventNames: function(eventName) {
    eventName = eventName || "";

    return _(eventName.split(" "))
      .map(function(name) {
        return name.trim();
      })
      .filter(function(name) {
        return name.length > 0;
      })
      .value();
  },

  /**
   * Creates a method name to use for binding a member event handler function to
   * the target instance.  E.g. if your target has a method named "onItemChanged", this method
   * will return a new function name like "_bound_onItemChanged" which can be used as a new
   * member name to store the bound member function.
   *
   * @param {String} methodName method name to prefix
   * @return {String} prefixed method name
   */
  getBoundMethodName: function(methodName) {
    return "_bound_" + methodName;
  }
};

module.exports = binder;
