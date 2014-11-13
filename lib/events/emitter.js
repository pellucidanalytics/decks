var _ = require("lodash");
var EventEmitter3 = require("eventemitter3");
var DecksEvent = require("./decksevent");

// Keep a refenrence to the super EventEmitter* prototype for faster access
var superPrototype = EventEmitter3.prototype;
var superPrototypeEmit = superPrototype.emit;

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

  options = _.merge({}, this.defaultOptions, options);

  /**
   * Generated unique id for the Emitter.  This is to help with debugging when multiple
   * Emitter instances are being used
   */
  this._emitterId = _.uniqueId();

  /**
   * List of listeners for any event
   */
  this._anyListeners = [];

  superPrototype.constructor.call(this, options);
}

Emitter.prototype = _.create(superPrototype, /** @lends Emitter.prototype */ {
  constructor: Emitter,

  /**
   * Default options for the Emitter instance.
   * Some of these are passed-through to the {@link external:EventEmitter3} constructor.
   */
  defaultOptions: {
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
  emit: function() {
    // If the arg is a DecksEvent, use the event.type as the emit type argument
    if (arguments.length >= 1 && (arguments[0] instanceof DecksEvent)) {
      var decksEvent = arguments[0];

      _.each(this._anyListeners, function(anyHandler) {
        anyHandler.call(this, decksEvent);
      });

      return superPrototypeEmit.call(this, decksEvent.type, decksEvent);
    }

    // If not a DecksEvent, just call the standard emit with arguments
    _.each(this._anyListeners, function(anyHandler) {
      anyHandler.apply(this, arguments);
    });

    return superPrototypeEmit.apply(this, arguments);
  },

  /**
   * Extension to EventEmitter3 to subscribe to any event.
   *
   * This is not supported by default by EventEmitter3.
   */
  onAny: function(listener) {
    this._anyListeners.push(listener);
  },

  /**
   * Extension to EventEmitter3 to unsubscribe from any event.
   *
   * This is not supported by default by EventEmitter3.
   */
  offAny: function(listener) {
    _.pull(this._anyListeners, listener);
  }
});

module.exports = Emitter;
