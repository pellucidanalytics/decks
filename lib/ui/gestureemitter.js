var _ = require("lodash");
var binder = require("../events").binder;

/**
 * Base class for gesture emitters
 *
 * @class
 * @abstract
 * @mixes binder
 * @param {!Element} element - element for which to add gesture support
 * @param {!Object} options - gesture configuration options
 * @param {!Hammer} options.hammer - Hammer instance for the element
 */
function GestureEmitter(element, options) {
  if (!(this instanceof GestureEmitter)) { return new GestureEmitter(element, options); }
  if (!element) { throw new Error("element is required"); }
  if (!options.hammer) { throw new Error("options.hammer is required"); }
  this.element = element;
  this.hammer = options.hammer;
}

_.extend(GestureEmitter.prototype, binder, /** @lends GestureEmitter.prototype */ {
  /**
   * Gets the hash of hammer events to method names that the subclass is interested in.
   * These events will be bound to the hammer instance in bindHammerEvents.
   *
   * @return {undefined}
   */
  getHammerEvents: function() {
    throw new Error("getHammerEvents is abstract");
  },

  /**
   * Binds to hammer events specified by getHammerEvents()
   *
   * @return {undefined}
   */
  bindHammerEvents: function() {
    this.bindEvents(this.hammer, this.getHammerEvents());
  },

  /**
   * Unbinds from hammer events specified by getHammerEvents()
   *
   * @return {undefined}
   */
  unbindHammerEvents: function() {
    this.unbindEvents(this.hammer, this.getHammerEvents());
  },

  /**
   * Tears down this instance, by unbinding from any events, and other related
   * tear down activities.
   *
   * @return {undefined}
   */
  destroy: function() {
    this.unbindHammerEvents();
  }
});

module.exports = GestureEmitter;
