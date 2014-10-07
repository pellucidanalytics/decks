var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");
var eventBinder = require("./util").eventBinder;
var rect = require("./util").rect;

/**
 * Canvas - manages the main DOM element in which items are rendered, and where
 * UI/touch/gesture events are first handled.
 *
 * @constructor
 * @augments EventEmitter2
 * @mixes eventBinder
 * @param {Object} options additional options
 */
function Canvas(options) {
  if (!(this instanceof Canvas)) { return new Canvas(options); }
  EventEmitter.call(this);

  this.setElement(options.element);

  if (options.frame) {
    this.setFrame(frame);
  }
}

inherits(Canvas, EventEmitter);

_.extend(Canvas.prototype, eventBinder, /** @lends Canvas.prototype */ {
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
    console.log("canvas: element set", this.element);

    this.element.classList.add("decks-canvas");
    this.element.style.position = "absolute";

    if (!options.silent) {
      this.emit("element:set", element);
    }
  },

  setFrame: function(frame, options) {
    if (!frame) { throw new Error("frame is required"); }
    options = options || {};

    if (this.frame === frame) {
      return;
    }

    if (this.frame) {
      this.unbindEvents(this.frame, this._frameEvents);
    }

    this.frame = frame;
    console.log("canvas: frame set", this.frame);

    this.frame.setCanvas(this);
    this.bindEvents(this.frame, this._frameEvents);

    if (!options.silent) {
      this.emit("canvas:frame:set", this.frame);
    }
  },

  setBounds: function(bounds) {
    if (!this.bounds) {
      this.bounds = bounds;

      this.element.style.width = this.bounds.width;
      this.element.style.height = this.bounds.height;
    } else {
    }
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
    console.log("canvas: add render");
    this.element.appendChild(render.element);
    render.isInCanvas = true;
    this.resizeToFitElement(render.element);
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
    console.log("canvas: remove render");
    this.element.removeChild(render.element);
    render.isInCanvas = false;
  },

  resizeToFitElement: function(element, options) {
    var unionRectangle = rect.union(element, this.bounds);
    this.setRectangle(unionRectangle);
  },

  resizeToFitAllElements: function(options) {
    var itemElements = this.element.querySelectorAll(".decks-item");
    var unionRectangle = rect.unionAll(itemElements);
    this.setRectangle(unionRectangle);
  },

  _frameEvents: {
    "frame:bounds:set": "_onFrameBoundsSet"
  },

  _onFrameBoundsSet: function() {
  }
});

module.exports = Canvas;
