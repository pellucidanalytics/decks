var _ = require("lodash");
var Hammer = require("hammerjs");
var GestureEmitter = require("./gestureemitter");
var DecksEvent = require("../events/decksevent");

/**
 * Class that emits or provides support for pan gestures/events.
 *
 * @class
 * @extends GestureEmitter
 * @param {!Object} options - Additional options
 * @param {!Element} options.element - element for which to listen/emit events
 * @param {?boolean} [options.horizontal=false] - Whether to monitor horizontal pan gestures.
 * @param {?boolean} [options.vertical=true] - Whether to monitor vertical pan gestures.
 * @param {?number} [options.threshold=0] - Threshold distance before pan gestures are detected.
 */

function PanEmitter(options) {
  if (!(this instanceof PanEmitter)) {
    return new PanEmitter(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  GestureEmitter.call(this, options);

  /** Whether to emit events for horizontal pan gestures. */
  this.horizontal = !!options.horizontal;

  /** Whether to emit events for horizontal pan gestures. */
  this.vertical = !!options.vertical;

  /** Pixel distance before pan events are emitted. */
  this.threshold = options.threshold || 0;

  if (options.horizontal && options.vertical) {
    /** Hammer direction enum value to use. */
    this.direction = Hammer.DIRECTION_ALL;
  } else if (options.horizontal) {
    this.direction = Hammer.DIRECTION_HORIZONTAL;
  } else {
    this.direction = Hammer.DIRECTION_VERTICAL;
  }

  this.hammer.get("pan").set({
    direction: this.direction,
    threshold: this.threshold
  });

  this.bindHammerEvents();
}

PanEmitter.prototype = _.create(GestureEmitter.prototype, /** @lends PanEmitter.prototype */ {
  constructor: PanEmitter,

  /**
   * Default options hash for constructor.
   */
  defaultOptions: _.merge({}, GestureEmitter.prototype.defaultOptions, {
    horizontal: false,
    vertical: true,
    threshold: 0
  }),

  /**
   * Returns the map of Hammer.js events to which to bind.
   */
  getHammerEvents: function() {
    var map = {
      "panstart": "onPanStart",
      "panend": "onPanEnd",
      "pancancel": "onPanCancel"
    };
    if (this.horizontal && this.vertical) {
      map.panmove = "onPanMove";
    } else if (this.horizontal) {
      map["panleft panright"] = "onPanX";
    } else if (this.vertical) {
      map["panup pandown"] = "onPanY";
    }
    return map;
  },

  onPanStart: function(e) {
    /**
     * Event for a pan start.
     *
     * @event PanEmitter#gesture:pan:start
     * @type {DecksEvent}
     * @property {String} type - the event type string
     * @property {PanEmitter} sender - the sender of the event
     * @property {*} data - the hammer event object
     */
    this.emit(DecksEvent("gesture:pan:start", this, e));
  },

  /**
   * Called when a panmove event is detected by Hammer.js.
   *
   * @fires PanEmitter#gesture:pan:any
   *
   * @param e - Hammer event object
   * @returns {undefined}
   */
  onPanMove: function(e) {
    // TODO: might want to emit pan:x and pan:y here too (if direction is applicable)

    /**
     * Event for a pan gesture in any direction.
     *
     * @event PanEmitter#gesture:pan:any
     * @type {DecksEvent}
     * @property {String} type - the event type string
     * @property {PanEmitter} sender - the sender of the event
     * @property {*} data - the hammer event object
     * @returns {undefined}
     */
    this.emit(DecksEvent("gesture:pan:any", this, e));
  },

  onPanX: function(e) {
    // TODO: might want to emit pan:any here too

    /**
     * Event for a pan gesture in the horizontal direction.
     *
     * @event PanEmitter#gesture:pan:x
     * @type {DecksEvent}
     * @property {String} type - the event type string
     * @property {PanEmitter} sender - the sender of the event
     * @property {*} data - the hammer event object
     */
    this.emit(DecksEvent("gesture:pan:x", this, e));
  },

  onPanY: function(e) {
    // TODO: might want to emit pan:any here too

    /**
     * Event for a pan gesture in the vertical direction.
     *
     * @event PanEmitter#gesture:pan:y
     * @type {DecksEvent}
     * @property {String} type - the event type string
     * @property {PanEmitter} sender - the sender of the event
     * @property {*} data - the hammer event object
     */
    this.emit(DecksEvent("gesture:pan:y", this, e));
  },

  onPanEnd: function(e) {
    /**
     * Event for a pan end.
     *
     * @event PanEmitter#gesture:pan:end
     * @type {DecksEvent}
     * @property {String} type - the event type string
     * @property {PanEmitter} sender - the sender of the event
     * @property {*} data - the hammer event object
     */
    this.emit(DecksEvent("gesture:pan:end", this, e));
  },

  onPanCancel: function(e) {
    /**
     * Event for a pan cancel.
     *
     * @event PanEmitter#gesture:pan:cancel
     * @type {DecksEvent}
     * @property {String} type - the event type string
     * @property {PanEmitter} sender - the sender of the event
     * @property {*} data - the hammer event object
     */
    this.emit(DecksEvent("gesture:pan:cancel", this, e));
  }
});

module.exports = PanEmitter;

