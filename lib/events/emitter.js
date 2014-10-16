var _ = require("lodash");
var EventEmitter2 = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");
var DecksEvent = require("./decksevent");

/**
 * Custom event emitter implementation, that extends EventEmitter2
 *
 * @class
 * @extends EventEmitter2
 * @param {Object} [options={}] - configuration options
 */
function Emitter(options) {
  if (!(this instanceof Emitter)) { return new Emitter(options); }
  options = _.merge({}, Emitter.defaultOptions, options);
  EventEmitter2.call(this, options);
}

inherits(Emitter, EventEmitter2);

Emitter.defaultOptions = {
  wildcard: true, // allow "*" wildcards for binding events
  delimiter: ":",
  newListener: false, // don't emit newListener event
  maxListeners: 0 // no limit
};

_.extend(Emitter.prototype, /** @lends Emitter.prototype */ {
  /**
   * Overrides the EventEmitter2 emit method to support a single {@link DecksEvent} argument,
   * which contains the event type as a property, along with other properties.
   *
   * @param {!(String|DecksEvent)} typeOrDecksEvent - event type String, or {@link DecksEvent} instance.
   * @param {...*} data - if the first argument is a String, the remaining arguments are emitted as the event data.
   * This argument is N/A if the first argument is a {@link DecksEvent} instance.
   * @return {boolean} True if at least one handler was invoked for the event, otherwise false
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
