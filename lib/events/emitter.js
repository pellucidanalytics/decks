var _ = require("lodash");
var EventEmitter2 = require("eventemitter2").EventEmitter2;
var DecksEvent = require("./decksevent");

/**
 * EventEmitter2 from npm
 *
 * @external EventEmitter2
 * @see https://www.npmjs.org/package/eventemitter2
 */

/**
 * Custom event emitter implementation, that extends EventEmitter2
 *
 * @class
 * @extends external:EventEmitter2
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
  this._id = _.uniqueId();

  EventEmitter2.call(this, options);
}

Emitter.prototype = _.create(EventEmitter2.prototype, /** @lends Emitter.prototype */ {
  constructor: Emitter,

  /**
   * Default options for the Emitter instance.
   * Some of these are passed-through to the {@link external:EventEmitter2} constructor.
   */
  defaultOptions: {
    wildcard: true, // allow "*" wildcards for binding events
    delimiter: ":",
    newListener: false, // don't emit newListener event
    maxListeners: 0 // no limit
  },

  /**
   * Overrides the EventEmitter2 emit method to support a single {@link DecksEvent} argument,
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
      return EventEmitter2.prototype.emit.call(this, decksEvent.type, decksEvent);
    }

    return EventEmitter2.prototype.emit.apply(this, arguments);
  }
});

module.exports = Emitter;
