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
    element = element || document.createElement("div");
    options = options || {};

    if (this.element === element) {
      return;
    }

    this.element = element;
    console.log("canvas: element set", this.element);

    this.element.classList.add("decks-canvas");
    this.element.style.position = "absolute";

    if (this.frame) {
      this.setFrameBounds(this.frame.bounds);
    }

    if (!options.silent) {
      this.emit("element:set", element);
    }
  },

  /**
   * Sets a reference to a Viewport on this Canvas
   *
   * @param viewport
   * @param options
   * @return {undefined}
   */
  setViewport: function(viewport, options) {
    if (!viewport) { throw new Error("viewport is required"); }
    options = options || {};

    if (this.viewport === viewport) {
      return;
    }

    if (this.viewport) {
      this.unbindEvents(this.viewport, this._viewportEvents);
    }

    this.viewport = viewport;
    this.bindEvents(this.viewport, this._viewportEvents);

    if (!options.silent) {
      this.emit("canvas:viewport:set", this.viewport);
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

    this.bindEvents(this.frame, this._frameEvents);

    this.frame.setCanvas(this);

    if (this.element) {
      this.setFrameBounds(this.frame.bounds);
    }

    if (!options.silent) {
      this.emit("canvas:frame:set", this.frame);
    }
  },

  setBounds: function(bounds, options) {
    options = options || {};

    this.bounds = bounds;
    console.log("canvas: bounds set", this.bounds);

    this.element.style.width = this.bounds.width + "px";
    this.element.style.height = this.bounds.height + "px";

    if (!options.silent) {
      this.emit("canvas:bounds:set", this.bounds);
    }
  },

  setFrameBounds: function(bounds) {
    this.frameBounds = bounds;

    if (!this.bounds) {
      this.setBounds(bounds);
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
    console.log("canvas: resizing to fit element", element, unionRectangle);
    this.setBounds(unionRectangle);
  },

  resizeToFitAllElements: function(options) {
    var itemElements = this.element.querySelectorAll(".decks-item");
    var unionRectangle = rect.unionAll(itemElements);
    this.setBounds(unionRectangle);
  },

  _viewportEvents: {
    "viewport:animation:complete": "_onViewportAnimationComplete"
  },

  _onViewportAnimationComplete: function(render) {
    this.resizeToFitElement(render.element);
  },

  _frameEvents: {
    "frame:bounds:set": "_onFrameBoundsSet",
  },

  _onFrameBoundsSet: function(bounds) {
    this.setFrameBounds(bounds);
  }
});

module.exports = Canvas;
