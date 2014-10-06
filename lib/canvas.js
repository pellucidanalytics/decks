var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");

/**
 * Canvas - manages the main DOM element in which items are rendered, and where
 * UI/touch/gesture events are first handled.
 *
 * @constructor
 * @param {Object} options additional options
 */
function Canvas(options) {
  if (!(this instanceof Canvas)) { return new Canvas(options); }
  EventEmitter.call(this);
  this.width = options.width || Canvas.Size.MatchFrame;
  this.height = options.height || Canvas.Size.Fluid;
  this.setElement(options.element);
}

inherits(Canvas, EventEmitter);

/**
 * Size constants for Canvas
 *
 * @memberof Canvas
 */
Canvas.Size = {
  MatchFrame: "MatchFrame",
  Fluid: "Fluid"
};

_.extend(Canvas.prototype, {
  /**
   * Sets the main container element, where items are rendered.  Creates a
   * div if no element is provided
   *
   * @memberof Canvas
   * @instance
   * @param {?HTMLElement} element element for the container
   * @param {?Object} options additional options
   * @return {undefined}
   */
  setElement: function(element, options) {
    options = options || {};

    if (!element) {
      element = document.createElement("div");
    }

    this.initializeElement(element);

    if (!options.silent) {
      this.emit("element:set", element);
    }
  },

  /**
   * Initializes the main container DOM element
   *
   * @memberof Canvas
   * @instance
   * @param {HTMLElement} element element to initialize
   * @return {undefined}
   */
  initializeElement: function(element) {
    element.classList.add("decks-canvas");
    element.style.position = "absolute";

    if (this.width === Canvas.Size.MatchFrame) {
      // set width to match frame
    } else if (_.isNumber(this.width)) {
      element.style.width = this.width + "px";
    } else if (this.width) {
      element.style.width = this.width;
    }

    if (_.isNumber(this.height)) {
      element.style.height = this.height + "px";
    }
  },

  /**
   * Adds a render (element) to the canvas, if not already added
   *
   * @memberof Canvas
   * @instance
   * @param {Object} render render to remove
   * @return {undefined}
   */
  addRender: function(render) {
    if (!render || !render.element || render.isInCanvas) {
      return;
    }
    console.log("add to canvas");
    this.element.appendChild(render.element);
    render.isInCanvas = true;
  },

  /**
   * Removes a render (element) from the Canvas, if present.
   *
   * @memberof Canvas
   * @instance
   * @param {Object} render render to remove
   * @return {undefined}
   */
  removeRender: function(render) {
    if (!render || !render.element || !render.isInCanvas) {
      return;
    }
    console.log("remove from canvas");
    this.element.removeChild(render.element);
    render.isInCanvas = false;
  }
});

module.exports = Canvas;
