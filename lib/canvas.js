var _ = require("lodash");
var binder = require("./events").binder;
var DecksEvent = require("./events").DecksEvent;
var hasEmitter = require("./events").hasEmitter;
var rect = require("./utils").rect;
var dom = require("./ui").dom;
var GestureHandler = require("./ui").GestureHandler;
var Layout = require("./layout");

/**
 * Canvas - manages the main DOM element in which items are rendered, and where
 * UI/touch/gesture events are first handled.
 *
 * @class
 * @mixes binder
 * @param {Object} options additional options
 */
function Canvas(options) {
  if (!(this instanceof Canvas)) {
    return new Canvas(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  this.setAnimator(options.animator);
  this.setConfig(options.config);
  this.setEmitter(options.emitter, this.emitterEvents);
  this.setLayout(options.layout);
  this.setElement(options.element || dom.create("div"));

  this.bindEvents(window, this.windowEvents);
}

_.extend(Canvas.prototype, binder, hasEmitter, /** @lends Canvas.prototype */ {
  defaultOptions: {
    //minItemPadding: { top: 0, bottom: 10, left: 0, right: 0 }
  },

  emitterEvents: {
    "deck:layout:set": "onDeckLayoutSet",
    "frame:bounds:set": "onFrameBoundsSet",
    "viewport:render:drawing": "onViewportRenderDrawing",
    "viewport:render:removed": "onViewportRenderRemoved",
    "viewport:all:renders:drawn": "onViewportAllRendersDrawn",
    "gesture:element:moved": "onGestureElementMoved"
  },

  windowEvents: {
    "resize": "onWindowResize", // TODO: might want to debounce this
    "scroll": "onWindowScroll" // TODO: might want to debounce this
  },

  defaultGestureHandlerOptions: {
    gestures: {
      mouseWheel: {
        enabled: true,
        horizontal: true,
        vertical: true
      },
      pan: {
        enabled: true,
        horizontal: true,
        vertical: true
      },
      swipe: {
        enabled: true,
        horizontal: true,
        vertical: true
      },
      tap: {
        enabled: true
      },
      press: {
        enabled: true
      }
    }
  },

  setAnimator: function(animator) {
    if (!animator) {
      throw new Error("Canvas#setAnimator: animator is required");
    }

    if (this.animator) {
      throw new Error("Canvas#setAnimator: animator already set");
    }

    this.animator = animator;
  },

  setConfig: function(config) {
    if (!config) {
      throw new Error("Canvas#setConfig: config is required");
    }

    if (this.config) {
      throw new Error("Canvas#setConfig: config already set");
    }

    this.config = config;
  },

  /**
   * Sets the main container element, where items are rendered.  Creates a
   * div if no element is provided
   *
   * @param {?HTMLElement} element element for the container
   * @param {?Object} options additional options
   * @return {undefined}
   */
  setElement: function(element) {
    if (!_.isElement(element)) {
      throw new Error("Canvas#setElement: element is required and must be an Element");
    }

    if (this.element) {
      throw new Error("Canvas#setElement: element already set");
    }

    dom.addClass(element, this.config.canvasClassName);
    dom.setStyle(element, "position", "absolute");
    dom.setStyle(element, "top", 0);
    dom.setStyle(element, "left", 0);
    this.element = element;

    this.emit(DecksEvent("canvas:element:set", this, this.element));
  },

  setLayout: function(layout) {
    if (!(layout instanceof Layout)) {
      throw new Error("Canvas#setLayout: layout is required and must be a Layout");
    }

    /*
    if (this.layout) {
      // TODO: any tear down things here?
      //console.log("canvas: changing layouts", this.layout, layout);
    }
    */

    this.layout = layout;

    this.configureGestures();

    this.resetPosition();
  },

  setBounds: function(bounds) {
    bounds = bounds || rect.normalize(this.element);

    if (rect.isEqual(this.bounds, bounds)) { return; }

    this.bounds = bounds;
    dom.setStyle(this.element, "width", this.bounds.width);
    dom.setStyle(this.element, "height", this.bounds.height);

    this.emit(DecksEvent("canvas:bounds:set", this, this.bounds));
  },

  setFrameBounds: function(frameBounds) {
    if (!frameBounds) {
      throw new Error("Canvas#setFrameBounds: frameBounds is required");
    }

    if (rect.isEqual(this.frameBounds, frameBounds)) { return; }

    this.frameBounds = frameBounds;

    this.emit(DecksEvent("canvas:frame:bounds:set", this, this.frameBounds));

    if (!this.bounds) {
      this.setBounds(this.frameBounds);
    }

    this.configureGestures();
  },

  /**
   * Adds a render (element) to the canvas, if not already added
   *
   * @param {Object} render render to remove
   * @return {undefined}
   */
  addRender: function(render) {
    if (!render) {
      throw new Error("Canvas#addRender: render is required");
    }

    if (render.isInCanvas) {
      return;
    }

    if (!_.isElement(render.element)) {
      throw new Error("Canvas#addRender: render.element is required and must be an Element");
    }

    dom.append(this.element, render.element);
    render.isInCanvas = true;

    this.emit(DecksEvent("canvas:render:added", this, render));
  },

  /**
   * Removes a render (element) from the Canvas, if present.
   *
   * @param {Object} render render to remove
   * @return {undefined}
   */
  removeRender: function(render) {
    if (!render) {
      throw new Error("Canvas#removeRender: render is required");
    }

    if (!render.isInCanvas) {
      return;
    }

    if (!_.isElement(render.element)) {
      throw new Error("Canvas#removeRender: render.element is required and must be an Element");
    }

    dom.remove(this.element, render.element);
    render.isInCanvas = false;

    this.emit(DecksEvent("canvas:render:removed", this, render));
  },

  resizeToFitElement: function(element) {
    if (!_.isElement(element)) {
      throw new Error("Canvas#resizeToFitElement: element is required and must be an Element");
    }

    // TODO: maybe don't need to check this.frameBounds
    var bounds = rect.unionAll([element, this.bounds, this.frameBounds]);

    this.setBounds(bounds);
  },

  resizeToFitAllElements: function() {
    var itemSelector = "." + this.config.itemClassName;

    // Convert DOM list data type to a plain Array
    var elements = _.map(this.element.querySelectorAll(itemSelector), _.identity);

    if (_.isEmpty(elements)) {
      return;
    }

    // TODO: optimize w/ concat
    var allElementsBounds = rect.unionAll(elements);
    var bounds = rect.union(allElementsBounds, this.frameBounds);

    this.setBounds(bounds);
  },

  resetPosition: function() {
    this.emit(DecksEvent("canvas:position:resetting", this));

    this.animator.animate(this.element, {
      top: 0,
      left: 0
    }, {
      duration: 400,
      complete: _.bind(function() {
        this.emit(DecksEvent("canvas:position:reset", this));
      }, this)
    });
  },

  /*
  panToElement: function(element) {
    // ask layout where to put element (e.g. centered, top-left, etc)
  },
  */

  configureGestures: function() {
    if (!this.element) {
      if (this.config.debugGestures) {
        console.warn("Canvas#configureGestures: not configuring gestures - Canvas element not set yet");
      }
      return;
    }

    var canvasGestureHandlerOptions = {
      animator: this.animator,
      config: this.config,
      emitter: this.emitter,
      bounds: this.frameBounds
    };

    var layoutGestureHandlerOptions = this.layout.getCanvasGestureOptions();

    var gestureHandlerOptions = _.merge(
      {},
      this.defaultGestureHandlerOptions,
      canvasGestureHandlerOptions,
      layoutGestureHandlerOptions);

    // TODO: don't destory gestures on frame bounds change
    if (this.gestureHandler) {
      this.gestureHandler.destroy();
    }

    this.gestureHandler = new GestureHandler(this.element, gestureHandlerOptions);
  },

  onDeckLayoutSet: function(e) {
    var layout = e.data;
    this.setLayout(layout);
  },

  onFrameBoundsSet: function(e) {
    var bounds = e.data;
    this.setFrameBounds(bounds);
  },

  onViewportRenderDrawing: function(e) {
    var render = e.data;
    this.addRender(render);
  },

  onViewportAllRendersDrawn: function() {
    if (this.config.debugDrawing) {
      console.log("Canvas#onViewportAllRendersDrawn: resizing canvas to fit all elements");
    }
    this.resizeToFitAllElements();
  },

  onViewportRenderRemoved: function(e) {
    var render = e.data;
    if (this.config.debugDrawing) {
      console.log("Canvas#onViewportRenderRemoved: render removed");
    }
    this.removeRender(render);
  },

  onGestureElementMoved: function(e) {
    var element = e.data;
    if (element !== this.element) {
      return;
    }
    this.setBounds();
  },

  onWindowScroll: function() {
    this.setBounds();
  },

  onWindowResize: function() {
    this.setBounds();
  }
});

module.exports = Canvas;
