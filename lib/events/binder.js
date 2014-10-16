var _ = require("lodash");

/**
 * Mixin for binding events from a source object to a target object
 *
 * @mixin
 */
var binder = {
  /**
   * Binds events from the source object to a handler method on 'this' object.
   * The handler method is automatically bound to 'this', and stored on 'this' using
   * a prefixed method name, based on the original method name.
   *
   * @param {!*} source object which emits an event, and can be subscribed to.
   * @param {!Object} eventToMethodMap hash of event name to method name of this.
   * @return {undefined}
   */
  bindEvents: function(source, eventToMethodMap) {
    _.each(eventToMethodMap, function(methodName, eventName) {
      if (!_.isFunction(this[methodName])) {
        throw new Error("target object does not have a method named " + methodName);
      }

      var eventNames = this._getEventNames(eventName);

      _.each(eventNames, function(eventName) {
        var bindMethodName = this._getBindMethodName(source, eventName);

        var boundMethodName = this._getBoundMethodName(methodName);

        if (!_.isFunction(this[boundMethodName])) {
          this[boundMethodName] = _.bind(this[methodName], this);
        }

        if (eventName === "*" || eventName === "**") {
          source[bindMethodName](this[boundMethodName]);
        } else {
          source[bindMethodName](eventName, this[boundMethodName]);
        }
      }, this);
    }, this);
  },

  /**
   * Unbinds from events from a given source object, which were previously bound using bindEvents.
   *
   * @param {!*} source source object that emits events
   * @param {!Object} eventToMethodMap hash of event names to method names of 'this'
   * @return {undefined}
   */
  unbindEvents: function(source, eventToMethodMap) {
    _.each(eventToMethodMap, function(methodName, eventName) {
      var eventNames = this._getEventNames(eventName);

      _.each(eventNames, function(eventName) {
        var unbindMethodName = this._getUnbindMethodName(source, eventName);

        var boundMethodName = this._getBoundMethodName(methodName);

        if (!this[boundMethodName]) {
          return;
        }

        if (eventName === "*" || eventName === "**") {
          source[unbindMethodName](this[boundMethodName]);
        } else {
          source[unbindMethodName](eventName, this[boundMethodName]);
        }
      }, this);
    }, this);
  },

  /**
   * Tries to find a method on the source object which can be used to bind events.
   *
   * @param {!*} source object that emits events
   * @return {String} first method name that could be used to bind events.
   */
  _getBindMethodName: function(source, eventName) {
    if (eventName === "*" || eventName === "**") {
      if (_.isFunction(source.onAny)) {
        return "onAny";
      } else {
        throw new Error("source does not have an onAny method");
      }
    }

    var name = _.find(["on", "addListener", "addEventListener", "attachEvent"], function(name) {
      return _.isFunction(source[name]);
    });

    if (!name) {
      throw new Error("source object does not have an event binding method");
    }

    return name;
  },

  /**
   * Tries to find a method on the source object which can be used to unbind events.
   *
   * @param {!*} source object which emits events
   * @return {String} first method name that could be used to unbind events.
   */
  _getUnbindMethodName: function(source, eventName) {
    if (eventName === "*" || eventName === "**") {
      if (_.isFunction(source.offAny)) {
        return "offAny";
      } else {
        throw new Error("source does not have an offAny method");
      }
    }

    var name = _.find(["off", "removeListener", "removeEventListener", "detachEvent"], function(name) {
      return _.isFunction(source[name]);
    });

    if (!name) {
      throw new Error("source object does not have an event unbinding method");
    }

    return name;
  },

  _getEventNames: function(eventName) {
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
  _getBoundMethodName: function(methodName) {
    return "_bound_" + methodName;
  }
};

module.exports = binder;
