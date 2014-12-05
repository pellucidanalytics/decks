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

  // Note: don't this.bind() here - let subclass bind after setting up other options
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
  setElement: function setElement(element) {
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
  setHammer: function setHammer(hammer) {
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
  getElementEvents: function getElementEvents() {
    return {};
  },

  /**
   * Binds all of the Element-level events specified by {@link GestureEmitter#getElementEvents}
   *
   * @return {undefined}
   */
  bindElementEvents: function bindElementEvents() {
    if (!this.enabled) {
      return;
    }
    this.bindEvents(this.element, this.getElementEvents());
  },

  /**
   * Unbinds all the Element-level events specified by {@link GestureEmitter#getElementEvents}
   *
   * @return {undefined}
   */
  unbindElementEvents: function unbindElementEvents() {
    if (!this.enabled) {
      return;
    }
    this.unbindEvents(this.element, this.getElementEvents());
  },

  /**
   * Gets a map of Hammer event names to method names for which to bind.
   *
   * This method should be implemented by the subclass, if the subclass is interested in Hammer
   * events.
   *
   * @return {undefined}
   */
  getHammerEvents: function getHammerEvents() {
    return {};
  },

  /**
   * Binds to Hammer events specified by {@link GestureEmitter#getHammerEvents}
   *
   * @return {undefined}
   */
  bindHammerEvents: function bindHammerEvents() {
    if (!this.enabled) {
      return;
    }
    this.bindEvents(this.hammer, this.getHammerEvents());
  },

  /**
   * Unbinds from hammer events specified by {@link GestureEmitter#getHammerEvents}
   *
   * @return {undefined}
   */
  unbindHammerEvents: function unbindHammerEvents() {
    if (!this.enabled) {
      return;
    }
    this.unbindEvents(this.hammer, this.getHammerEvents());
  },

  /**
   * Binds all events (element and Hammer)
   *
   * @return {undefined}
   */
  bind: function bind() {
    this.bindElementEvents();
    this.bindHammerEvents();
  },

  /**
   * Unbinds all events (element and Hammer)
   *
   * @return {undefined}
   */
  unbind: function unbind() {
    this.unbindElementEvents();
    this.unbindHammerEvents();
  },

  /**
   * Destroys this instance by unbinding from all bound events (Element-level, and Hammer).
   *
   * @return {undefined}
   */
  destroy: function destroy() {
    this.unbind();
  }
});

module.exports = GestureEmitter;
