var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");
var Canvas = require("./canvas");

/**
 * Represents the Viewport Frame.  The Frame is essentially a DOM element which acts as the
 * visible portion of the decks system.  The Frame is always set to position relative, and
 * overflow hidden.  The Frame contains a Canvas (element), which can move around within the
 * Frame element.  The Frame crops the content of the Canvas at the Frame edges.
 *
 * @constructor
 * @augments EventEmitter2
 * @param {Object} options frame options
 */
function Frame(options) {
  if (!(this instanceof Frame)) { return new Frame(options); }
  EventEmitter.call(this);

  this.setElement(options.element);
  this.setCanvas(options.canvas);
  this.bindDOMEvents();
}

inherits(Frame, EventEmitter);

_.extend(Frame.prototype, {
  /**
   * Sets the Frame's DOM element (container)
   *
   * @memberof Frame
   * @instance
   * @param {HTMLElement} element the Frame's main container element
   * @param {Object} options frame options
   * @return {undefined}
   */
  setElement: function(element, options) {
    if (!element) { throw new Error("element is required"); }
    options = options || {};

    this.element = element;
    this.initializeElement();

    if (!options.silent) {
      this.emit("element:set", element);
    }
  },

  setCanvas: function(canvas, options) {
    options = options || {};
    canvas = canvas || {};

    if (!(canvas instanceof Canvas)) {
      canvas = new Canvas(canvas);
    }

    this.canvas = canvas;
    this.element.innerHTML = "";
    this.element.appendChild(this.canvas.element);

    if (!options.silent) {
      this.emit("canvas:set", canvas);
    }
  },

  /**
   * Indicates if the given element is currently visible within the
   * Frame's container element.
   *
   * @param {HTMLElement} element element to check for visibility
   * @return {boolean} whether the element is visible in the Frame
   */
  isElementVisible: function(element) {
    return true;
  },

  initializeElement: function(options) {
    options = options || {};

    this.element.classList.add("decks-frame");
    this.element.style.position = "relative";
    this.element.style.overflow = "hidden";
    this.setElementSize();
  },

  setElementSize: function(options) {
    options = options || {};

    var rect = this.element.getBoundingClientRect();

    // Fix IE8 quirks with ClientRect
    if (!rect.width) {
      rect.width = rect.right - rect.left;
    }
    if (!rect.height) {
      rect.height = rect.bottom - rect.top;
    }

    this.element.style.width = rect.width;
    this.element.style.height = rect.height;

    if (!options.silent) {
      this.emit("frame:element:sized");
    }
  },

  bindDOMEvents: function() {
  },

  unbindDOMEvents: function() {
  }
});

module.exports = Frame;
