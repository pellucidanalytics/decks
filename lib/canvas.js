var _ = require("lodash");
var binder = require("./events").binder;
var DecksEvent = require("./events").DecksEvent;
var hasEmitter = require("./events").hasEmitter;
var rect = require("./utils").rect;
var dom = require("./ui").dom;
var GestureHandler = require("./ui").GestureHandler;

/**
 * Canvas - manages the main DOM element in which items are rendered, and where
 * UI/touch/gesture events are first handled.
 *
 * @constructor
 * @mixes binder
 * @param {Object} options additional options
 */
function Canvas(options) {
  if (!(this instanceof Canvas)) { return new Canvas(options); }
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
    "viewport:animation:begin": "onViewportAnimationBegin",
    "viewport:animation:complete": "onViewportAnimationComplete",
    "viewport:render:removed": "onViewportRenderRemoved",
    "viewport:all:renders:drawn": "onViewportAllRendersDrawn",
    "gesture:element:moved": "onGestureElementMoved"
  },

  windowEvents: {
    "resize": "onWindowResize",
    "scroll": "onWindowScroll"
  },

  setAnimator: function(animator) {
    if (!animator) { throw new Error("animator is required"); }
    this.animator = animator;
  },

  setConfig: function(config) {
    if (!config) { throw new Error("config is required"); }
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
    if (!element) { throw new Error("element is required"); }
    if (this.element) { throw new Error("element already set"); }
    dom.addClass(element, this.config.canvasClassName);
    dom.setStyle(element, "position", "absolute");
    dom.setStyle(element, "top", 0);
    dom.setStyle(element, "left", 0);
    this.element = element;
    this.emit(DecksEvent("canvas:element:set", this, this.element));
  },

  setLayout: function(layout) {
    if (!layout) { throw new Error("layout is required"); }
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
    if (this.bounds === bounds) { return; }
    this.bounds = bounds;
    dom.setStyle(this.element, "width", this.bounds.width);
    dom.setStyle(this.element, "height", this.bounds.height);
    this.emit(DecksEvent("canvas:bounds:set", this, this.bounds));
  },

  setFrameBounds: function(frameBounds) {
    if (!frameBounds) { throw new Error("frameBounds is required"); }
    if (this.frameBounds === frameBounds) { return; }
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
    if (!render) { throw new Error("render is required"); }
    if (render.isInCanvas) { return; }
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
    if (!render) { throw new Error("render is required"); }
    if (!render.isInCanvas) { return; }
    dom.remove(this.element, render.element);
    render.isInCanvas = false;
    this.emit(DecksEvent("canvas:render:removed", this, render));
  },

  resizeToFitElement: function(element) {
    if (!_.isElement(element)) { throw new Error("element is required"); }
    var bounds = rect.unionAll([element, this.bounds, this.frameBounds]);
    this.setBounds(bounds);
  },

  resizeToFitAllElements: function() {
    console.log("resize to fit all");
    var itemSelector = "." + this.config.itemClassName;
    var elements = _.map(this.element.querySelectorAll(itemSelector), function(element) {
      return element;
    });
    var elementBounds = rect.unionAll(elements);
    var bounds = rect.union(elementBounds, this.frameBounds);
    this.setBounds(bounds);
  },

  resetPosition: function() {
    this.animator.animate(this.element, {
      top: 0,
      left: 0
    }, {
      duration: 400
    });
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
        enabled: true,
      },
      press: {
        enabled: true
      }
    }
  },

  configureGestures: function() {
    if (!this.element) {
      return;
    }
    var canvasGestureHandlerOptions = {
      animator: this.animator,
      config: this.config,
      emitter: this.emitter,
      bounds: this.frameBounds
    };
    var layoutGestureHandlerOptions = this.layout.getCanvasGestureOptions();
    var gestureHandlerOptions = _.merge({}, this.defaultGestureHandlerOptions, canvasGestureHandlerOptions, layoutGestureHandlerOptions);

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

  onViewportAnimationBegin: function(e) {
    var render = e.data;
    this.addRender(render);
  },

  onViewportAnimationComplete: function(e) {
    var render = e.data;
    this.resizeToFitElement(render.element);
  },

  onViewportRenderRemoved: function(e) {
    var render = e.data;
    this.removeRender(render);
  },

  onViewportAllRendersDrawn: function() {
    this.resizeToFitAllElements();
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
