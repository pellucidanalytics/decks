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

  this.setConfig(options.config);
  this.setEmitter(options.emitter, this.emitterEvents);
  this.setElement(options.element);

  this.bindEvents(window, this.windowEvents);
}

_.extend(Frame.prototype, binder, hasEmitter, /** @lends Frame.prototype */ {
  defaultOptions: {
  },

  emitterEvents: {
    "canvas:element:set": "onCanvasElementSet",
    "deck:resize": "onDeckResize"
  },

  windowEvents: {
    "resize": "onWindowResize", // TODO: might want to debounce
    "scroll": "onWindowScroll" // TODO: might want to debounce
  },

  setConfig: function(config) {
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
  setElement: function(element) {
    validate(element, "element", { isElement: true, isNotSet: this.element });

    this.element = element;

    dom.addClass(this.element, this.config.frameClassName);

    // Frame must be positioned (absolute, relative or fixed), so that the Canvas can be positioned within it
    if (!dom.isPositioned(this.element)) {
      dom.setStyle(this.element, "position", "relative");
    }

    // Note: overflow auto does not work with Hammer.js gesture detection on scrollable panels
    dom.setStyle(this.element, "overflow", "auto");
    //dom.setStyle(this.element, "overflow", "scroll");
    //dom.setStyle(this.element, "overflow", "hidden");

    this.emit(DecksEvent("frame:element:set", this, element));

    this.setBounds();
  },

  /**
   * Sets the frame size parameters
   *
   * @param options
   * @return {undefined}
   */
  setBounds: function() {
    var bounds = rect.normalize(this.element);

    if (rect.isEqual(this.bounds, bounds)) {
      return;
    }

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
  isElementVisible: function(element) {
    validate(element, "element", { isElement: true });

    return rect.intersects(this.element, element);
  },

  onCanvasElementSet: function(e) {
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

  onDeckResize: function() {
    this.setBounds();
  },

  /**
   * Called on window resize event
   *
   * @return {undefined}
   */
  onWindowResize: function() {
    this.setBounds();
  },

  onWindowScroll: function() {
    this.setBounds();
  }
});

module.exports = Frame;
