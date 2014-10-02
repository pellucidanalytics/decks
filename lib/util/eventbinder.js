var _ = require("lodash");

var eventBinder = {

  addTo: function(target) {
    _.forOwn(this, function(value, key) {
      if (key === "addTo") {
        return;
      }
      target[key] = value;
    });
  },

  getBoundMethodName: function(methodName) {
    return "_bound_" + methodName;
  },

  bindEvents: function(source, eventToMethodMap) {
    if (!_.isFunction(source.on)) {
      throw new Error("source object cannot be bound to (no on method)");
    }

    _.each(eventToMethodMap, function(methodName, eventName) {
      if (!_.isFunction(this[methodName])) {
        throw new Error("target does not have a method named " + methodName);
      }
      var boundMethodName = this.getBoundMethodName(methodName);
      this[boundMethodName] = _.bind(this[methodName], this);
      source.on(eventName, this[boundMethodName]);
    }, this);
  },

  unbindEvents: function(source, eventToMethodMap) {
    if (!_.isFunction(source.off)) {
      throw new Error("source object cannot be unbound from (no off method)");
    }

    _.each(eventToMethodMap, function(methodName, eventName) {
      var boundMethodName = this.getBoundMethodName(methodName);
      if (!this[boundMethodName]) {
        return;
      }
      source.off(eventName, this[boundMethodName]);
    }, this);
  }
};

module.exports = eventBinder;
