var _ = require("lodash");
var GestureEmitter = require("./gestureemitter");
var DecksEvent = require("../events/decksevent");

/**
 * Gesture emitter that monitors a single element for press (long-touch/hold) events.
 *
 * @class
 * @extends GestureEmitter
 * @param {!Object} options - Additional options
 * @param {?(Emitter|Object)} [options.emitter={}] - Emitter instance or options on which to emit events
 * @param {!Element} options.element - Element for which to bind events
 * @param {!Hammer} options.hammer - Hammer instance for the element (required by base class)
 * @param {?boolean} [options.enabled=false] - Whether to enable this emitter
 */
function PressEmitter(options) {
  if (!(this instanceof PressEmitter)) {
    return new PressEmitter(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  GestureEmitter.call(this, options);

  this.threshold = options.threshold;
  this.time = options.time;

  this.hammer.get("press").set({
    threshold: this.threshold,
    time: this.time
  });

  this.bind();
}

PressEmitter.prototype = _.create(GestureEmitter.prototype, /** @lends PressEmitter.prototype */ {
  constructor: PressEmitter,

  /**
   * Default options
   */
  defaultOptions: _.merge({}, GestureEmitter.prototype.defaultOptions, {
    threshold: 5,
    time: 1000
  }),

  /**
   * Gets a map of hammer events to monitor for press-related gestures.
   */
  getHammerEvents: function getHammerEvents() {
    return {
      "press": "onPress"
    };
  },

  /**
   * Called when a Hammer.js press event occurs
   *
   * @param e - Hammer.js event Object
   * @fires PressEmitter#gesture:press
   */
  onPress: function onPress(e) {
    /**
     * Event for a press (long-touch/hold) gesture.
     *
     * @event PressEmitter#gesture:press
     * @type {DecksEvent}
     * @property {String} type - The event type string
     * @property {PressEmitter} sender - The PressEmitter instance sending the event.
     * @property {*} data - The Hammer.js press event object.
     */
    this.emit(DecksEvent("gesture:press", this, e));
  }
});

module.exports = PressEmitter;
