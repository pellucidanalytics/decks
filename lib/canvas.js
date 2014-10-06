var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");
var rectangles = require("./util").rectangles;

/**
 * Canvas - manages the main DOM element in which items are rendered, and where
 * UI/touch/gesture events are first handled.
 *
 * @constructor
 * @augments EventEmitter2
 * @param {Object} options additional options
 */
function Canvas(options) {
  if (!(this instanceof Canvas)) { return new Canvas(options); }
  EventEmitter.call(this);

  this._rectangle = {
    top: 100000,
    bottom: -100000,
    left: 100000,
    right: -100000
  };

  this.setElement(options.element);
}

inherits(Canvas, EventEmitter);

_.extend(Canvas.prototype, /** @lends Canvas.prototype */ {
  /**
   * Sets the main container element, where items are rendered.  Creates a
   * div if no element is provided
   *
   * @param {?HTMLElement} element element for the container
   * @param {?Object} options additional options
   * @return {undefined}
   */
  setElement: function(element, options) {
    options = options || {};

    this.element = element || document.createElement("div");
    this.element.classList.add("decks-canvas");
    this.element.style.position = "absolute";

    if (!options.silent) {
      this.emit("element:set", element);
    }
  },

  setRectangle: function(rectangle) {
    if (!rectangle) { throw new Error("rectangle is required"); }
    this.rectangle = rectangle;
    this.element.style.width = dimensions.width;
    this.element.style.height = dimensions.height;
  },

  /**
   * Adds a render (element) to the canvas, if not already added
   *
   * @param {Object} render render to remove
   * @return {undefined}
   */
  addRender: function(render, options) {
    if (!render || !render.element || render.isInCanvas) {
      return;
    }
    console.log("add to canvas");
    this.element.appendChild(render.element);
    render.isInCanvas = true;
    this.growToFitElement(render.element);
  },

  /**
   * Removes a render (element) from the Canvas, if present.
   *
   * @param {Object} render render to remove
   * @return {undefined}
   */
  removeRender: function(render, options) {
    if (!render || !render.element || !render.isInCanvas) {
      return;
    }
    console.log("remove from canvas");
    this.element.removeChild(render.element);
    render.isInCanvas = false;
  },

  resizeToFitElement: function(element, options) {
    var unionRectangle = rectangles.union(element, this.rectangle);
    this.setRectangle(unionRectangle);
  },

  resizeToFitAllElements: function(options) {
    var itemElements = this.element.querySelectorAll(".decks-item");
    var unionRectangle = rectangles.unionAll(itemElements);
    this.setRectangle(unionRectangle);
  }
});

module.exports = Canvas;
