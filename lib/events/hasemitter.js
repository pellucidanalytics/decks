var _ = require("lodash");
var Emitter = require("./emitter");

/**
 * Mixin for objects that have an Emitter instance.  Exposes emitter methods,
 * and calls through to this.emitter.
 */
var hasEmitter = {
  setEmitter: function(emitter, emitterEvents) {
    if (!emitter) { throw new Error("emitter is required"); }
    if (this.emitter) { throw new Error("emitter already set"); }
    if (!(emitter instanceof Emitter)) {
      emitter = new Emitter(emitter);
    }
    this.emitter = emitter;
    if (emitterEvents) {
      if (!_.isFunction(this.bindEvents)) {
        throw new Error("setEmitter: events were specified, but target object does not have a bindEvents method");
      }
      this.bindEvents(this.emitter, emitterEvents);
    }
  },

  emit: function() {
    this.emitter.emit.apply(this.emitter, arguments);
  },

  on: function() {
    this.emitter.on.apply(this.emitter, arguments);
  },

  off: function() {
    this.emitter.off.apply(this.emitter, arguments);
  },

  onAny: function() {
    this.emitter.onAny.apply(this.emitter, arguments);
  },

  offAny: function() {
    this.emitter.offAny.apply(this.emitter, arguments);
  }
};

module.exports = hasEmitter;
