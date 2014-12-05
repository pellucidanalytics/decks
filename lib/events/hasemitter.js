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
   *
   * @instance
   * @param {!(Object|Emitter)} emitter - Emitter instance or options
   * @returns {undefined}
   */
  setEmitter: function setEmitter(emitter) {
    validate(emitter, "emitter", { isRequired: true, isNotSet: this.emitter });

    if (!(emitter instanceof Emitter)) {
      emitter = new Emitter(emitter);
    }

    this.emitter = emitter;
  },

  /**
   * Calls through to {@link Emitter#emit}
   *
   * @instance
   */
  emit: function emit() {
    this.emitter.emit.apply(this.emitter, arguments);
  },

  /**
   * Calls through to {@link Emitter#on}
   *
   * @instance
   */
  on: function on() {
    this.emitter.on.apply(this.emitter, arguments);
  },

  /**
   * Calls through to {@link Emitter#off}
   *
   * @instance
   */
  off: function off() {
    this.emitter.off.apply(this.emitter, arguments);
  },

  /**
   * Calls through to {@link Emitter#onAny}
   *
   * @instance
   */
  onAny: function onAny() {
    this.emitter.onAny.apply(this.emitter, arguments);
  },

  /**
   * Calls through to {@link Emitter#offAny}
   *
   * @instance
   */
  offAny: function offAny() {
    this.emitter.offAny.apply(this.emitter, arguments);
  },

  /**
   * Calls through to {@link Emitter#once}
   */
  once: function once() {
    this.emitter.once.apply(this.emitter, arguments);
  }
};

module.exports = hasEmitter;
