var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");
var eventBinder = require("./util").eventBinder;
var rect = require("./util").rect;

/**
 * Represents the Viewport Frame.  The Frame is essentially a DOM element which acts as the
 * visible portion of the decks system.  The Frame is always set to position relative, and
 * overflow hidden.  The Frame contains a Canvas (element), which can move around within the
 * Frame element.  The Frame crops the content of the Canvas at the Frame edges.
 *
 * @constructor
 * @augments EventEmitter2
 * @mixes eventBinder
 * @param {!Object} options Frame options
 * @param {!HTMLElement} options.element Frame container element
 * @param {?(Canvas|Object)} options.canvas Frame canvas instance or options
 */
function Frame(options) {
  if (!(this instanceof Frame)) { return new Frame(options); }
  if (!options) { throw new Error("options is required"); }
  EventEmitter.call(this);

  this.setElement(options.element);

  if (options.canvas) {
    this.setCanvas(options.canvas);
  }
}

inherits(Frame, EventEmitter);

_.extend(Frame.prototype, eventBinder, /** @lends Frame.prototype */ {
  /**
   * Sets the Frame's DOM element (container)
   *
   * @param {HTMLElement} element the Frame's main container element
   * @param {Object} options frame options
   * @return {undefined}
   */
  setElement: function(element, options) {
    if (!element) { throw new Error("element is required"); }
    options = options || {};

    if (this.element) {
      this.unbindEvents(window, this._windowEvents);
    }

    this.element = element;
    console.log("frame: element set", this.element);

    this.element.classList.add("decks-frame");
    this.element.style.position = "relative";
    this.element.style.overflow = "hidden";

    this.setBounds();

    this.bindEvents(window, this._windowEvents);

    if (!options.silent) {
      this.emit("frame:element:set", element);
    }
  },

  /**
   * Sets the Frame's Canvas instance
   *
   * @param {Canvas} canvas canvas to set
   * @param {?Object} options additional options
   * @return {undefined}
   */
  setCanvas: function(canvas, options) {
    if (!canvas) { throw new Error("canvas is required"); }
    options = options || {};

    if (this.canvas === canvas) {
      return;
    }

    this.canvas = canvas;
    console.log("frame: canvas set", this.canvas);

    this.canvas.setFrame(this);

    if (this.element) {
      this.element.innerHTML = "";
      this.element.appendChild(this.canvas.element);
    }

    if (!options.silent) {
      this.emit("frame:canvas:set", canvas);
    }
  },

  /**
   * Sets the frame size parameters
   *
   * @param options
   * @return {undefined}
   */
  setBounds: function(options) {
    options = options || {};

    this.bounds = rect.normalize(this.element);
    console.log("frame: bounds set", this.bounds);

    if (!options.silent) {
      this.emit("frame:bounds:set", this.bounds);
    }
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
    return rect.intersects(this.element, element);
  },

  /**
   * Mapping of window events to method names
   */
  _windowEvents: {
    "resize": "_onWindowResize"
  },

  /**
   * Called on window resize event
   *
   * @return {undefined}
   */
  _onWindowResize: function() {
    this.setBounds();
  }
});

module.exports = Frame;
