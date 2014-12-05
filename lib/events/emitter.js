var _ = require("lodash");
var EventEmitter3 = require("eventemitter3");
var DecksEvent = require("./decksevent");

// Keep a refenrence to the super EventEmitter* prototype for faster access
var superPrototype = EventEmitter3.prototype;
var superPrototypeEmit = superPrototype.emit;
var superPrototypeOn = superPrototype.on;
var superPrototypeOff = superPrototype.off;

/**
 * Custom event emitter implementation, that extends EventEmitter3
 *
 * @class
 * @extends external:EventEmitter3
 * @param {Object} [options={}] - configuration options
 */
function Emitter(options) {
  if (!(this instanceof Emitter)) {
    return new Emitter(options);
  }

  superPrototype.constructor.call(this);

  options = _.merge({}, this.defaultOptions, options);

  /**
   * Generated unique id for the Emitter.  This is to help with debugging when multiple
   * Emitter instances are being used
   */
  this._emitterId = _.uniqueId();

  /**
   * Wildcard for subscribing to any event
   */
  this._wildcard = options.wildcard;

  /**
   * List of listeners for any event
   */
  this._anyListeners = [];
}

Emitter.prototype = _.create(superPrototype, /** @lends Emitter.prototype */ {
  constructor: Emitter,

  /**
   * Default options for the Emitter instance.
   */
  defaultOptions: {
    wildcard: "*"
  },

  /**
   * Overrides the EventEmitter3 emit method to support a single {@link DecksEvent} argument,
   * which contains the event type as a property, along with other properties.
   *
   * @param {!(String|DecksEvent)} typeOrDecksEvent - event type String, or {@link DecksEvent} instance.
   * @param {...*} data - if the first argument is a String, the remaining arguments are emitted as the event data.
   * This argument is N/A if the first argument is a {@link DecksEvent} instance.
   * @return {boolean} - true if at least one handler was invoked for the event, otherwise false
   */
  emit: function emit() {
    var self = this;

    // If the arg is a DecksEvent, use the event.type as the emit type argument
    if (arguments.length === 1 && (arguments[0] instanceof DecksEvent)) {
      var decksEvent = arguments[0];

      _.each(this._anyListeners, function(anyListener) {
        anyListener.fn.call(anyListener.context || self, decksEvent);
      });

      superPrototypeEmit.call(this, decksEvent.type, decksEvent);
      return;
    }

    // Invoke any listeners (strip off the event "type" argument)
    var args = Array.prototype.slice.call(arguments, 1);
    _.each(this._anyListeners, function(anyListener) {
      anyListener.fn.apply(anyListener.context || self, args);
    });

    superPrototypeEmit.apply(this, arguments);
  },

  /**
   * Wraps the super "on" method, and adds support for using event "*" to subscribe to any event.
   *
   * @param {String} event - event name or "*"
   * @param {Function} fn - event listener callback function
   * @param {*} context - context to use for invoking callback function
   * @return {undefined}
   */
  on: function on(event, fn, context) {
    if (event === this._wildcard) {
      this.onAny(fn, context);
      return;
    }

    superPrototypeOn.call(this, event, fn, context);
  },

  /**
   * Wraps the super "off" method, and adds support for using event "*" to unsubscribe from any event.
   *
   * @param {String} event - event name or "*"
   * @param {Function} fn - callback function
   * @param {*} context - context for callback function
   * @return {undefined}
   */
  off: function off(event, fn, context) {
    if (event === this._wildcard) {
      this.offAny(fn, context);
      return;
    }

    // Note: do not pass context here - it's expecting "once" value, which we're not doing right now
    superPrototypeOff.call(this, event, fn);
  },

  /**
   * Extension to EventEmitter3 to subscribe to any event.
   */
  onAny: function onAny(fn, context) {
    this._anyListeners.push({
      fn: fn,
      context: context
    });
  },

  /**
   * Extension to EventEmitter3 to unsubscribe from any event.
   */
  offAny: function offAny(fn, context) {
    this._anyListeners = _.filter(this._anyListeners, function(anyListener) {
      return !(anyListener.fn === fn && anyListener.context === context);
    });
  }
});

module.exports = Emitter;
