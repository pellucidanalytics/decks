var _ = require("lodash");
var services = require("./services");
var binder = require("./events").binder;
var DecksEvent = require("./events").DecksEvent;
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
  options = _.merge({}, Canvas.defaultOptions, options);
  this.setElement(options.element || dom.create("div"));
  this.setOptions(options);
  this.bindEvents(services.emitter, Canvas.emitterEvents);
  this.bindEvents(window, Canvas.windowEvents);
}

Canvas.emitterEvents = {
  "deck:layout:set": "onDeckLayoutSet",
  "frame:bounds:set": "onFrameBoundsSet",
  "viewport:animation:begin": "onViewportAnimationBegin",
  "viewport:animation:complete": "onViewportAnimationComplete",
  "viewport:render:removed": "onViewportRenderRemoved",
  "gesture:element:moved": "onGestureElementMoved"
};

Canvas.windowEvents = {
  "resize": "onWindowResize",
  "scroll": "onWindowScroll"
};

_.extend(Canvas.prototype, binder, /** @lends Canvas.prototype */ {
  defaultOptions: {
    //minItemPadding: { top: 0, bottom: 10, left: 0, right: 0 }
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
    dom.addClass(element, services.constants.canvasClassName);
    dom.setStyle(element, "position", "absolute");
    dom.setStyle(element, "top", 0);
    dom.setStyle(element, "left", 0);
    this.element = element;
    services.emitter.emit(DecksEvent("canvas:element:set", this, this.element));
  },

  setOptions: function(options) {
    if (!options) { throw new Error("options is required"); }
    //this.minItemPadding = options.minItemPadding;
  },

  setBounds: function(bounds) {
    bounds = bounds || rect.normalize(this.element);
    if (this.bounds === bounds) { return; }
    this.bounds = bounds;
    dom.setStyle(this.element, "width", this.bounds.width);
    dom.setStyle(this.element, "height", this.bounds.height);
    services.emitter.emit(DecksEvent("canvas:bounds:set", this, this.bounds));
  },

  setFrameBounds: function(frameBounds) {
    if (!frameBounds) { throw new Error("frameBounds is required"); }
    if (this.frameBounds === frameBounds) { return; }
    this.frameBounds = frameBounds;
    services.emitter.emit(DecksEvent("canvas:frame:bounds:set", this, this.frameBounds));
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
    services.emitter.emit(DecksEvent("canvas:render:added", this, render));
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
    services.emitter.emit(DecksEvent("canvas:render:removed", this, render));
  },

  resizeToFitElement: function(element) {
    if (!_.isElement(element)) { throw new Error("element is required"); }
    var bounds = rect.unionAll([element, this.bounds, this.frameBounds]);
    this.setBounds(bounds);
  },

  resizeToFitAllElements: function() {
    var itemSelector = "." + services.constants.itemClassName;
    var elements = this.element.querySelectorAll(itemSelector);
    var elementBounds = rect.unionAll(elements);
    var bounds = rect.union(elementBounds, this.frameBounds);
    this.setBounds(bounds);
  },

  defaultGestureOptions: {
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
      }
    },
    snapping: {
      threshold: 40,
      scale: 0.5,
      animateOptions: {
        duration: 400,
        easing: [200, 20]
      }
    },
    inertia: {
    }
  },

  configureGestures: function() {
    var defaultGestureOptions = this.defaultGestureOptions;
    var instanceGestureOptions = {
      bounds: this.frameBounds
    };
    var layoutGestureOptions = services.layout.getCanvasGestureOptions();
    var gestureOptions = _.merge({}, defaultGestureOptions, instanceGestureOptions, layoutGestureOptions);

    if (this.gestureHandler) {
      this.gestureHandler.destroy();
    }

    this.gestureHandler = new GestureHandler(this.element, gestureOptions);
  },

  onDeckLayoutSet: function() {
    this.configureGestures();
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
