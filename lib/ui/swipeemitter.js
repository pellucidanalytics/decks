var _ = require("lodash");
var Hammer = require("hammerjs");
var GestureEmitter = require("./gestureemitter");
var DecksEvent = require("../events/decksevent");

/**
 * Class that emits or provides support for swipe gestures/events.
 *
 * @class
 * @extends GestureEmitter
 * @param {!Object} options - Additional options
 * @param {?(Emitter|Object)} [options.emitter={}] - Emitter instance or options on which to emit events
 * @param {!Element} options.element - Element for which to bind events
 * @param {!Hammer} options.hammer - Hammer instance for the element (required by base class)
 * @param {?boolean} [options.enabled=false] - Whether to enable this emitter
 * @param {?boolean} [options.horizontal=false] - Whether to detect horizontal swipes
 * @param {?boolean} [options.vertical=true] - Whether to detect vertical swipes
 * @param {?number} [options.threshold=0] - Movement distance (px) required before swipe is detected
 * @param {?number} [options.velocity=0.65] - Movement speed (px/ms) required before swipe is detected
 */
function SwipeEmitter(options) {
  if (!(this instanceof SwipeEmitter)) {
    return new SwipeEmitter(options);
  }

  options = _.merge({}, this.defaultOptions, options);
  GestureEmitter.call(this, options);

  /**
   * Whether to monitor horizontal swipes
   */
  this.horizontal = options.horizontal;

  /**
   * Whether to monitor vertical swipes
   */
  this.vertical = options.vertical;

  /**
   * Threshold movement before swipe gesture is recognized (px)
   */
  this.threshold = options.threshold;

  /**
   * Threshold velocity before swipe gesture is recognized (px/ms)
   */
  this.velocity = options.velocity;

  if (this.horizontal && this.vertical) {
    /**
     * Hammer.js direction enum value
     */
    this.direction = Hammer.DIRECTION_ALL;
  } else if (this.horizontal) {
    this.direction = Hammer.DIRECTION_HORIZONTAL;
  } else {
    this.direction = Hammer.DIRECTION_VERTICAL;
  }

  this.hammer.get("swipe").set({
    direction: this.direction,
    threshold: this.threshold,
    velocity: this.velocity
  });

  this.bind();
}

SwipeEmitter.prototype = _.create(GestureEmitter.prototype, /** @lends SwipeEmitter.prototype */ {
  constructor: SwipeEmitter,

  /**
   * Default options
   */
  defaultOptions: _.merge({}, GestureEmitter.prototype.defaultOptions, {
    /**
     * Whether to detect and emit events for horizontal swipes
     */
    horizontal: false,

    /**
     * Whether to detect and emit events for vertical swipes
     */
    vertical: true,

    /**
     * Minimum distance of movement (px) required before a swipe gesture is recognized.
     */
    threshold: 0,

    /**
     * Minimum velocity of movement (px/ms) required before a swipe gesture is recognized.
     */
    velocity: 0.65
  }),

  getHammerEvents: function getHammerEvents() {
    var map = { };

    if (this.horizontal && this.vertical) {
      map.swipe = "onSwipe";
    } else if (this.horizontal) {
      map["swipeleft swiperight"] = "onSwipeX";
    } else if (this.vertical) {
      map["swipeup swipedown"] = "onSwipeY";
    }

    return map;
  },

  onSwipe: function onSwipe(e) {
    /**
     * Event for a swipe in any direction
     *
     * @event SwipeEmitter#gesture:swipe:any
     * @type {DecksEvent}
     * @property type
     * @property sender
     * @property data
     */
    this.emit(DecksEvent("gesture:swipe:any", this, e));
  },

  onSwipeX: function onSwipeX(e) {
    /**
     * Event for a swipe in horizontal direction
     *
     * @event SwipeEmitter#gesture:swipe:x
     * @type {DecksEvent}
     * @property type
     * @property sender
     * @property data
     */
    this.emit(DecksEvent("gesture:swipe:x", this, e));
  },

  onSwipeY: function onSwipeY(e) {
    /**
     * Event for a swipe in vertical direction
     *
     * @event SwipeEmitter#gesture:swipe:y
     * @type {DecksEvent}
     * @property type
     * @property sender
     * @property data
     */
    this.emit(DecksEvent("gesture:swipe:y", this, e));
  }
});

module.exports = SwipeEmitter;
