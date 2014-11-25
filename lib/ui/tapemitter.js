var _ = require("lodash");
var GestureEmitter = require("./gestureemitter");
var DecksEvent = require("../events/decksevent");

/**
 * Class that monitors an element for tap (click/touch) events/gestures.
 *
 * @class
 * @extends GestureEmitter
 * @param {!Object} options - Additional options
 * @param {?(Emitter|Object)} [options.emitter={}] - Emitter instance or options on which to emit events
 * @param {!Element} options.element - Element for which to bind events
 * @param {!Hammer} options.hammer - Hammer instance for the element (required by base class)
 * @param {?boolean} [options.enabled=false] - Whether to enable this emitter
 */
function TapEmitter(options) {
  if (!(this instanceof TapEmitter)) {
    return new TapEmitter(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  GestureEmitter.call(this, options);

  this.bindHammerEvents();
}

TapEmitter.prototype = _.create(GestureEmitter.prototype, /** @lends TapEmitter.prototype */ {
  constructor: TapEmitter,

  defaultOptions: _.merge({}, GestureEmitter.prototype.defaultOptions, {
  }),

  getHammerEvents: function() {
    return {
      "tap": "onTap"
    };
  },

  onTap: function(e) {
    /**
     * Event for a tap (click/touch) event
     *
     * @event TapEmitter#gesture:tap
     * @type {DecksEvent}
     * @property type
     * @property sender
     * @property data
     */
    this.emit(DecksEvent("gesture:tap", this, e));
  }
});

module.exports = TapEmitter;
