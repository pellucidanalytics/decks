var _ = require("lodash");
var Hammer = require("hammerjs");
var GestureEmitter = require("./gestureemitter");
var DecksEvent = require("../events/decksevent");

/**
 * Class that emits or provides support for swipe gestures/events.
 *
 * @class
 * @extends GestureEmitter
 * @param {!Element} element - Element for which to monitor for swipe events.
 * @param {?Object} options - Additional options
 */
function SwipeEmitter(element, options) {
  if (!(this instanceof SwipeEmitter)) {
    return new SwipeEmitter(element, options);
  }

  options = _.merge({}, this.defaultOptions, options);

  GestureEmitter.call(this, element, options);

  /** Whether to monitor horizontal swipes */
  this.horizontal = options.horizontal;

  /** Whether to monitor vertical swipes */
  this.vertical = options.vertical;

  /** Threshold movement before swipe gesture is recognized (px) */
  this.threshold = options.threshold;

  /** Threshold velocity before swipe gesture is recognized (px/ms) */
  this.velocity = options.velocity;

  if (this.horizontal && this.vertical) {
    /** Hammer.js direction enum value */
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

  this.bindHammerEvents();
}

SwipeEmitter.prototype = _.create(GestureEmitter.prototype, /** @lends SwipeEmitter.prototype */ {
  constructor: SwipeEmitter,

  defaultOptions: _.merge({}, GestureEmitter.prototype.defaultOptions, {
    horizontal: false,
    vertical: true,
    threshold: 0,
    velocity: 0.64
  }),

  getHammerEvents: function() {
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

  onSwipe: function(e) {
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

  onSwipeX: function(e) {
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

  onSwipeY: function(e) {
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
