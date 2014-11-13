var _ = require("lodash");
var Emitter = require("./emitter");
var validate = require("../utils/validate");

/**
 * Mixin for objects that have an {@link Emitter} instance.  Exposes key {@link Emitter} methods,
 * and calls through to this.emitter.
 *
 * This is just for convenience and consistency for objects that have an {@link Emitter}.
 *
 * @mixin
 */
var hasEmitter = {
  /**
   * Sets an emitter instance on 'this' and optionally binds events from
   * the emitter to methods on 'this' using the emitterEvents hash arguments
   *
   * @instance
   * @param {!(Object|Emitter)} emitter - Emitter instance or options
   * @param {?Object} emitterEvents - hash of event names to method names, for which to bind to on the emitter.
   * @returns {undefined}
   */
  setEmitter: function(emitter, emitterEvents) {
    validate(emitter, "emitter", { isRequired: true, isNotSet: this.emitter });

    if (!(emitter instanceof Emitter)) {
      emitter = new Emitter(emitter);
    }

    this.emitter = emitter;

    if (emitterEvents) {
      if (!_.isFunction(this.bindEvents)) {
        throw new Error("hasEmitter#setEmitter: events were specified, but target object does not have a bindEvents method");
      }

      this.bindEvents(this.emitter, emitterEvents);
    }
  },

  /**
   * Calls through to {@link Emitter#emit}
   *
   * @instance
   */
  emit: function() {
    this.emitter.emit.apply(this.emitter, arguments);
  },

  /**
   * Calls through to {@link Emitter#on}
   *
   * @instance
   */
  on: function() {
    this.emitter.on.apply(this.emitter, arguments);
  },

  /**
   * Calls through to {@link Emitter#off}
   *
   * @instance
   */
  off: function() {
    this.emitter.off.apply(this.emitter, arguments);
  },

  /**
   * Calls through to {@link Emitter#onAny}
   *
   * @instance
   */
  onAny: function() {
    this.emitter.onAny.apply(this.emitter, arguments);
  },

  /**
   * Calls through to {@link Emitter#offAny}
   *
   * @instance
   */
  offAny: function() {
    this.emitter.offAny.apply(this.emitter, arguments);
  }
};

module.exports = hasEmitter;
