var _ = require("lodash");

/**
 * Mixin for binding events from a source object to a target object
 */
var eventBinder = {
  /**
   * Mixes the event binder methods into a target object
   *
   * @param {Object} target object onto which to add event binder support
   * @return {undefined}
   */
  addTo: function(target) {
    _.forOwn(this, function(value, key) {
      if (key === "addTo") {
        return;
      }
      if (target[key]) {
        throw new Error("Over-writing method " + key + " on event target object.");
      }
      target[key] = value;
    });
  },

  bindEvents: function(source, eventToMethodMap) {
    var bindMethodName = this._getBindMethodName(source);
    _.each(eventToMethodMap, function(methodName, eventName) {
      if (!_.isFunction(this[methodName])) { throw new Error("target object does not have a method named " + methodName); }
      var boundMethodName = this._getBoundMethodName(methodName);
      this[boundMethodName] = _.bind(this[methodName], this);
      source[bindMethodName](eventName, this[boundMethodName]);
    }, this);
  },

  unbindEvents: function(source, eventToMethodMap) {
    var unbindMethodName = this._getUnbindMethodName(source);
    _.each(eventToMethodMap, function(methodName, eventName) {
      var boundMethodName = this._getBoundMethodName(methodName);
      if (!this[boundMethodName]) {
        return;
      }
      source[unbindMethodName](eventName, this[boundMethodName]);
    }, this);
  },

  _getBindMethodName: function(source) {
    var name = _.find(["on", "addEventListener", "attachEvent"], function(name) {
      return _.isFunction(source[name]);
    });
    if (!name) { throw new Error("source object does not have an event binding method"); }
    return name;
  },

  _getUnbindMethodName: function(source) {
    var name = _.find(["off", "removeEventListener", "detachEvent"], function(name) {
      return _.isFunction(source[name]);
    });
    if (!name) { throw new Error("source object does not have an event unbinding method"); }
    return name;
  },

  _getBoundMethodName: function(methodName) {
    return "_bound_" + methodName;
  }
};

module.exports = eventBinder;
