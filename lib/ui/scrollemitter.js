var _ = require("lodash");
var GestureEmitter = require("./gestureemitter");
var DecksEvent = require("../events/decksevent");

/**
 * Gesture emitter which monitors for Element scroll events, and re-emits
 * them on the {@link Emitter}.  Note that scroll events are fired on a scrollable
 * container, not an a scrollable element itself.
 *
 * @param {!Object} options - Additional options
 * @param {?(Emitter|Object)} [options.emitter={}] - Emitter instance or options on which to emit events
 * @param {!Element} options.element - Element for which to bind events
 * @param {!Hammer} options.hammer - Hammer instance for the element (required by base class)
 * @param {?boolean} [options.enabled=false] - Whether to enable this emitter
 * @return {ScrollEmitter}
 */
function ScrollEmitter(options) {
  if (!(this instanceof ScrollEmitter)) {
    return new ScrollEmitter(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  GestureEmitter.prototype.constructor.call(this, options);

  this.bind();
}

ScrollEmitter.prototype = _.create(GestureEmitter.prototype, /** @lends ScrollEmitter.prototype */ {
  constructor: ScrollEmitter,

  /**
   * Default options
   */
  defaultOptions: _.merge({}, GestureEmitter.prototype.defaultOptions, {
  }),

  getElementEvents: function getElementEvents() {
    return {
      "scroll": "onScroll"
    };
  },

  /**
   * Called when a scroll event occurs on the Element.
   *
   * Re-emits the scroll event as a {@link DecksEvent}.
   *
   * @param e
   * @return {undefined}
   */
  onScroll: function onScroll(e) {
    this.emit(DecksEvent("gesture:scroll", this, e));
  }
});

module.exports = ScrollEmitter;
