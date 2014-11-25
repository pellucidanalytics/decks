var _ = require("lodash");
var binder = require("../events").binder;
var hasEmitter = require("../events").hasEmitter;
var validate = require("../utils/validate");

/**
 * Base class for gesture emitters.
 *
 * The purpose of this class is to abstract away different types of gesture and UI events
 * and re-emit the events in a normalized structures ({@link DecksEvent}), via a decks {@link Emitter}.
 *
 * @class
 * @abstract
 * @mixes binder
 * @mixes hasEmitter
 * @param {!Object} options - gesture configuration options
 * @param {?(Emitter|Object)} [options.emitter={}] - Emitter instance or options on which to emit events
 * @param {!Element} options.element - Element for which to listen for and emit gesture/DOM events
 * @param {!Hammer} options.hammer - Hammer instance for the element
 * @param {boolean} options.enabled - whether this {@link GestureEmitter} is enabled (binds to/re-emits gesture events)
 */
function GestureEmitter(options) {
  if (!(this instanceof GestureEmitter)) {
    return new GestureEmitter(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  /**
   * Indicates if this emitter is enabled (listens for events, and forwards them on the {@link Emitter})
   */
  this.enabled = !!options.enabled;

  this.setEmitter(options.emitter || {});
  this.setElement(options.element);
  this.setHammer(options.hammer);
}

_.extend(GestureEmitter.prototype, binder, hasEmitter, /** @lends GestureEmitter.prototype */ {
  /**
   * Default options
   */
  defaultOptions: {
    /**
     * Whether this {@link GestureEmitter} is enabled - defaults to false
     */
    enabled: false
  },

  /**
   * Sets the Element monitored by this {@link GestureEmitter}
   *
   * @param {!Element} element - element to monitor
   * @return {undefined}
   */
  setElement: function(element) {
    validate(element, "element", { isElement: true, isNotSet: this.element });
    this.element = element;
  },

  /**
   * Sets the Hammer instance for this {@link GestureEmitter}
   *
   * The Hammer instance also wraps the element, and recognizes gestures.
   *
   * @param hammer
   * @return {undefined}
   */
  setHammer: function(hammer) {
    validate(hammer, "hammer", { isRequired: true, isNotSet: this.hammer });
    this.hammer = hammer;
  },

  /**
   * Gets a map of Element/DOM event names to method names for which to bind.
   *
   * This method should be implemented by a subclass, if the subclass is interested in DOM element-level
   * events.
   *
   * @return {undefined}
   */
  getElementEvents: function() {
    return {};
  },

  /**
   * Binds all of the Element-level events specified by {@link GestureEmitter#getElementEvents}
   *
   * @return {undefined}
   */
  bindElementEvents: function() {
    if (!this.enabled) {
      return;
    }
    var map = this.getElementEvents();
    if (!_.isEmpty(map)) {
      this.bindEvents(this.element, map);
    }
  },

  /**
   * Unbinds all the Element-level events specified by {@link GestureEmitter#getElementEvents}
   *
   * @return {undefined}
   */
  unbindElementEvents: function() {
    if (!this.enabled) {
      return;
    }
    var map = this.getElementEvents();
    if (!_.isEmpty(map)) {
      this.unbindEvents(this.element, map);
    }
  },

  /**
   * Gets a map of Hammer event names to method names for which to bind.
   *
   * This method should be implemented by the subclass, if the subclass is interested in Hammer
   * events.
   *
   * @return {undefined}
   */
  getHammerEvents: function() {
    return {};
  },

  /**
   * Binds to Hammer events specified by {@link GestureEmitter#getHammerEvents}
   *
   * @return {undefined}
   */
  bindHammerEvents: function() {
    if (!this.enabled) {
      return;
    }
    var map = this.getHammerEvents();
    if (!_.isEmpty(map)) {
      this.bindEvents(this.hammer, map);
    }
  },

  /**
   * Unbinds from hammer events specified by {@link GestureEmitter#getHammerEvents}
   *
   * @return {undefined}
   */
  unbindHammerEvents: function() {
    if (!this.enabled) {
      return;
    }
    var map = this.getHammerEvents();
    if (!_.isEmpty(map)) {
      this.unbindEvents(this.hammer, map);
    }
  },

  /**
   * Destroys this instance by unbinding from all bound events (Element-level, and Hammer).
   *
   * @return {undefined}
   */
  destroy: function() {
    this.unbindElementEvents();
    this.unbindHammerEvents();
  }
});

module.exports = GestureEmitter;
