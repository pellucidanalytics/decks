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

  /**
   * Minimum taps required to recognize
   */
  this.taps = options.taps;

  /**
   * Max time in ms between multiple taps
   */
  this.interval = options.interval;

  /**
   * Max press time in ms
   */
  this.time = options.time;

  /**
   * Max movement allowed during tap
   */
  this.threshold = options.threshold;

  /**
   * Max position difference between multiple taps
   */
  this.posThreshold = options.posThreshold;

  this.hammer.get("tap").set({
    taps: this.taps,
    interval: this.interval,
    time: this.time,
    threshold: this.threshold,
    posThreshold: this.posThreshold
  });

  this.bind();
}

TapEmitter.prototype = _.create(GestureEmitter.prototype, /** @lends TapEmitter.prototype */ {
  constructor: TapEmitter,

  defaultOptions: _.merge({}, GestureEmitter.prototype.defaultOptions, {
    taps: 1,
    interval: 300,
    time: 250,
    threshold: 2,
    posThreshold: 10
  }),

  getHammerEvents: function getHammerEvents() {
    return {
      "tap": "onTap"
    };
  },

  onTap: function onTap(e) {
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
