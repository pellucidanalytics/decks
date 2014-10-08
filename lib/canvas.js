var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");
var eventBinder = require("./util").eventBinder;
var rect = require("./util").rect;
var Pannable = require("./ui").Pannable;

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
    this.setFrame(options.frame);
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

    if (this.element === element) { return; }

    this.element = element;
    this.element.classList.add("decks-canvas");
    this.element.style.position = "absolute";
    this.element.style.top = "0";
    this.element.style.left = "0";


    if (this.frame && this.frame.bounds) {
      this.setFrameBounds(this.frame.bounds);
    }

    if (!options.silent) {
      //console.log("canvas: element set", this.element);
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

    if (this.viewport === viewport) { return; }

    if (this.viewport) {
      this.unbindEvents(this.viewport, this._viewportEvents);
    }

    this.viewport = viewport;
    this.bindEvents(this.viewport, this._viewportEvents);

    if (!options.silent) {
      //console.log("canvas: viewport set", this.viewport);
      this.emit("canvas:viewport:set", this.viewport);
    }
  },

  setFrame: function(frame, options) {
    if (!frame) { throw new Error("frame is required"); }
    options = options || {};

    if (this.frame === frame) { return; }

    if (this.frame) {
      this.unbindEvents(this.frame, this._frameEvents);
    }

    this.frame = frame;
    this.frame.setCanvas(this);
    this.bindEvents(this.frame, this._frameEvents);

    if (this.element) {
      this.setFrameBounds(this.frame.bounds);
      this.pannable = new Pannable({ element: this.element, bounds: this.frame.bounds });
    }

    if (!options.silent) {
      //console.log("canvas: frame set", this.frame);
      this.emit("canvas:frame:set", this.frame);
    }
  },

  setBounds: function(bounds, options) {
    if (!bounds) { throw new Error("bounds is required"); }
    if (!this.element) { throw new Error("cannot set bounds without this.element"); }
    options = options || {};

    this.bounds = bounds;
    this.element.style.width = this.bounds.width + "px";
    this.element.style.height = this.bounds.height + "px";

    if (!options.silent) {
      //console.log("canvas: bounds set", this.bounds);
      this.emit("canvas:bounds:set", this.bounds);
    }
  },

  setFrameBounds: function(bounds) {
    if (!bounds) { throw new Error("bounds is required"); }

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
    if (!render) { throw new Error("render is required"); }
    options = options || {};

    if (render.isInCanvas) { return; }

    this.element.appendChild(render.element);
    render.isInCanvas = true;

    if (!options.silent) {
      //console.log("canvas: render added");
      this.emit("canvas:render:added", render);
    }
  },

  /**
   * Removes a render (element) from the Canvas, if present.
   *
   * @param {Object} render render to remove
   * @return {undefined}
   */
  removeRender: function(render, options) {
    if (!render) { throw new Error("render is required"); }
    options = options || {};

    if (!render.isInCanvas) { return; }

    this.element.removeChild(render.element);
    render.isInCanvas = false;

    if (!options.silent) {
      //console.log("canvas: render removed");
      this.emit("canvas:render:removed", render);
    }
  },

  resizeToFitElement: function(element, options) {
    if (!_.isElement(element)) { throw new Error("element is required"); }
    options = options || {};

    if (!this.bounds) { throw new Error("cannot resize without this.bounds"); }

    var bounds = rect.union(element, this.bounds);
    this.setBounds(bounds);

    if (!options.silent) {
      //console.log("canvas: bounds set", bounds);
      this.emit("canvas:bounds:set", bounds);
    }
  },

  resizeToFitAllElements: function() {
    var elements = this.element.querySelectorAll(".decks-item");
    var bounds = rect.unionAll(elements);
    this.setBounds(bounds);
  },

  _viewportEvents: {
    "viewport:animation:begin": "_onViewportAnimationBegin",
    "viewport:animation:complete": "_onViewportAnimationComplete",
    "viewport:render:removed": "_onViewportRenderRemoved"
  },

  _onViewportAnimationBegin: function(render) {
    this.addRender(render);
  },

  _onViewportAnimationComplete: function(render) {
    this.resizeToFitElement(render.element);
  },

  _onViewportRenderRemoved: function(render) {
    this.removeRender(render);
  },

  _frameEvents: {
    "frame:bounds:set": "_onFrameBoundsSet"
  },

  _onFrameBoundsSet: function(bounds) {
    this.setFrameBounds(bounds);
  }
});

module.exports = Canvas;
