var _ = require("lodash");
var binder = require("../events").binder;
var hasEmitter = require("../events").hasEmitter;

/**
 * Base class for gesture emitters
 *
 * @class
 * @abstract
 * @mixes binder
 * @mixes hasEmitter
 * @param {!Element} element - element for which to add gesture support
 * @param {!Object} options - gesture configuration options
 * @param {!Hammer} options.hammer - Hammer instance for the element
 */
function GestureEmitter(element, options) {
  if (!(this instanceof GestureEmitter)) {
    return new GestureEmitter(element, options);
  }

  options = _.merge({}, this.defaultOptions, options);

  this.setEmitter(options.emitter || {});
  this.setElement(element);
  this.setHammer(options.hammer);
}

_.extend(GestureEmitter.prototype, binder, hasEmitter, /** @lends GestureEmitter.prototype */ {
  defaultOptions: {
  },

  setElement: function(element) {
    if (!_.isElement(element)) {
      throw new Error("GestureEmitter#setElement: element is required and must be an Element");
    }

    if (this.element) {
      throw new Error("GestureEmitter#setElement: element already set");
    }

    this.element = element;
  },

  setHammer: function(hammer) {
    if (!hammer) {
      throw new Error("GestureEmitter.setHammer: hammer is required");
    }

    if (this.hammer) {
      throw new Error("GestureEmitter.setHammer: hammer already set");
    }

    this.hammer = hammer;
  },

  /**
   * Gets the hash of hammer events to method names that the subclass is interested in.
   * These events will be bound to the hammer instance in bindHammerEvents.
   *
   * @return {undefined}
   */
  getHammerEvents: function() {
    throw new Error("GestureEmitter#getHammerEvents: abstract method");
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
