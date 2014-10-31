var _ = require("lodash");
var GestureEmitter = require("./gestureemitter");
var DecksEvent = require("../events/decksevent");

/**
 * Gesture emitter that monitors a single element for press (long-touch/hold) events.
 *
 * @class
 * @extends GestureEmitter
 * @param {!Element} element - Element to monitor
 * @param {?Object} [options={}] - Additional options
 */
function PressEmitter(element, options) {
  if (!(this instanceof PressEmitter)) {
    return new PressEmitter(element, options);
  }

  options = _.merge({}, this.defaultOptions, options);

  GestureEmitter.call(this, element, options);

  this.bindHammerEvents();
}

PressEmitter.prototype = _.create(GestureEmitter.prototype, /** @lends PressEmitter.prototype */ {
  constructor: PressEmitter,

  /**
   * Default options
   */
  defaultOptions: _.merge({}, GestureEmitter.prototype.defaultOptions, {
  }),

  /**
   * Gets a map of hammer events to monitor for press-related gestures.
   */
  getHammerEvents: function() {
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
  onPress: function(e) {
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
