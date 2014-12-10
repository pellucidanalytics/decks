var _ = require("lodash");
var binder = require("./events").binder;
var hasEmitter = require("./events").hasEmitter;
var DecksEvent = require("./events").DecksEvent;
var rect = require("./utils").rect;
var dom = require("./ui").dom;
var validate = require("./utils/validate");

/**
 * Represents the Viewport Frame.  The Frame is essentially a DOM element which acts as the
 * visible portion of the decks system.  The Frame is always set to position relative, and
 * overflow hidden.  The Frame contains a Canvas (element), which can move around within the
 * Frame element.  The Frame crops the content of the Canvas at the Frame edges.
 *
 * @class
 * @mixes binder
 * @mixes hasEmitter
 * @param {!Object} options Frame options
 * @param {!HTMLElement} options.element Frame container element
 * @param {?(Canvas|Object)} options.canvas Frame canvas instance or options
 */
function Frame(options) {
  if (!(this instanceof Frame)) {
    return new Frame(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  this.frameId = _.uniqueId();
  this.position = options.position;
  this.overflow = options.overflow;
  this.watchWindowResize = options.watchWindowResize;
  this.watchWindowScroll = options.watchWindowScroll;
  this.debouncedOnWindowResize = _.debounce(this.onWindowResize, options.debouncedWindowResizeWait);
  this.debouncedOnWindowScroll = _.debounce(this.onWindowScroll, options.debouncedWindowScrollWait);

  this.setConfig(options.config);
  this.setEmitter(options.emitter);
  this.setElement(options.element);

  this.bind();

  this.emit(DecksEvent("frame:ready", this));
}

_.extend(Frame.prototype, binder, hasEmitter, /** @lends Frame.prototype */ {
  defaultOptions: {
    position: "relative",
    overflow: "auto",
    watchWindowResize: true,
    watchWindowScroll: true,
    debouncedWindowResizeWait: 200,
    debouncedWindowScrollWait: 200
  },

  /**
   * Gets the {@link Emitter} events map.
   *
   * @return {Object}
   */
  getEmitterEvents: function() {
    return {
      "canvas:element:set": "onCanvasElementSet",
      "deck:resize": "onDeckResize"
    };
  },

  /**
   * Gets the window events map.
   *
   * @return {Object}
   */
  getWindowEvents: function() {
    var map = {};
    if (this.watchWindowResize) {
      map.resize = "debouncedOnWindowResize";
    }
    if (this.watchWindowScroll) {
      map.scroll = "debouncedOnWindowScroll";
    }
    return map;
  },

  /**
   * Binds the {@link Emitter} and window events.
   *
   * @return {undefined}
   */
  bind: function bind() {
    this.bindEvents(this.emitter, this.getEmitterEvents());
    this.bindEvents(window, this.getWindowEvents());
  },

  /**
   * Unbinds the {@link Emitter} and window events.
   *
   * @return {undefined}
   */
  unbind: function unbind() {
    this.unbindEvents(this.emitter, this.getEmitterEvents());
    this.unbindEvents(window, this.getWindowEvents());
  },

  /**
   * Sets the config object.
   *
   * @param config
   * @return {undefined}
   */
  setConfig: function setConfig(config) {
    validate(config, "config", { isPlainObject: true, isNotSet: this.config });

    this.config = config;
  },

  /**
   * Sets the Frame's DOM element (container)
   *
   * @param {HTMLElement} element the Frame's main container element
   * @param {Object} options frame options
   * @return {undefined}
   */
  setElement: function setElement(element) {
    validate(element, "element", { isElement: true, isNotSet: this.element });

    this.element = element;

    if (!element.id) {
      this.element.id = this.config.frameClassName + "-" + this.frameId;
    }

    dom.addClass(this.element, this.config.frameClassName);

    // Frame must be positioned (absolute, relative or fixed), so that the Canvas can be positioned within it
    if (!dom.isPositioned(this.element)) {
      dom.setStyle(this.element, "position", this.position);
    }

    dom.setStyle(this.element, "overflow", this.overflow);

    this.emit(DecksEvent("frame:element:set", this, element));

    this.setBounds();
  },

  /**
   * Sets the frame size parameters
   *
   * @param options
   * @return {undefined}
   */
  setBounds: function setBounds() {
    var bounds = rect.normalize(this.element);

    if (rect.isEqual(this.bounds, bounds)) {
      return;
    }

    this.emit(DecksEvent("frame:bounds:setting", this, { oldBounds: this.bounds, newBounds: bounds }));

    this.bounds = bounds;

    this.emit(DecksEvent("frame:bounds:set", this, this.bounds));
  },

  /**
   * Indicates if the given element is currently visible within the
   * Frame's container element.  This might be a combination of the element's
   * bounding rect being inside the Frame element, and stacking like z-index.
   *
   * @param {HTMLElement} element element to check for visibility
   * @return {boolean} whether the element is visible in the Frame
   */
  isElementVisible: function isElementVisible(element) {
    validate(element, "element", { isElement: true });

    return rect.intersects(this.element, element);
  },

  /**
   * Called when the {@link Canvas} element has been set.
   *
   * This appends the {@link Canvas} element in the {@link Frame} element, and also
   * initializes the {@link Canvas} with the {@link Frame} and {@link Frame} bounds.
   *
   * @param e
   * @return {undefined}
   */
  onCanvasElementSet: function onCanvasElementSet(e) {
    var canvas = e.sender;
    var canvasElement = e.data;

    // Add the Canvas element to the Frame element
    dom.empty(this.element);
    dom.append(this.element, canvasElement);

    // Set the initial canvas bounds to match the frame
    // TODO: there might be a better way to do this - the problem is that the Frame bounds are
    // set and an event is emitted before the Canvas has been instantiated, and there is somewhat
    // of a circular dependency between Frame and Canvas.
    canvas.setFrame(this);
    canvas.setFrameBounds(this.bounds);
  },

  /**
   * Called when a deck:resize event is received.  This event is used by the caller
   * to request that the {@link Frame} re-calculate it's bounds.  If the {@link Frame}
   * bounds have changed, it will usually trigger a render cycle in the {@link Viewport}.
   *
   * @return {undefined}
   */
  onDeckResize: function onDeckResize() {
    this.setBounds();
  },

  /**
   * Called on window resize event.  Causes the {@link Frame} to re-calculate its bounds,
   * which might result in a render cycle in the {@link Viewport}.
   *
   * @return {undefined}
   */
  onWindowResize: function onWindowResize() {
    this.setBounds();
  },

  /**
   * Called on window scroll event.  Causes the {@link Frame} to re-calculate its bounds,
   * which might result in a render cycle in the {@link Viewport}.
   *
   * @return {undefined}
   */
  onWindowScroll: function onWindowScroll() {
    this.setBounds();
  }
});

module.exports = Frame;
