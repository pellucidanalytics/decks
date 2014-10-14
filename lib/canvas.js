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
  this.options = options || {};

  this.setElement(this.options.element || dom.create("div"));

  this.bindEvents(services.emitter, Canvas.emitterEvents);
}

Canvas.emitterEvents = {
  "deck:layout:set": "onDeckLayoutSet",
  "frame:bounds:set": "onFrameBoundsSet",
  "viewport:animation:begin": "onViewportAnimationBegin",
  "viewport:animation:complete": "onViewportAnimationComplete",
  "viewport:render:removed": "onViewportRenderRemoved"
};

_.extend(Canvas.prototype, binder, /** @lends Canvas.prototype */ {
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

  setBounds: function(bounds) {
    if (!bounds) { throw new Error("bounds is required"); }
    if (this.bounds === bounds) { return; }
    this.bounds = bounds;
    dom.setStyle(this.element, "width", this.bounds.width);
    dom.setStyle(this.element, "height", this.bounds.height);
    services.emitter.emit(DecksEvent("canvas:bounds:set", this, this.bounds));
  },

  setFrameBounds: function(bounds) {
    if (!bounds) { throw new Error("bounds is required"); }
    if (this.frameBounds === bounds) { return; }
    this.frameBounds = bounds;
    services.emitter.emit(DecksEvent("canvas:frame:bounds:set", this, this.frameBounds));

    // If we don't have Canvas bounds at this time, set them to match the Frame bounds
    if (!this.bounds) {
      this.setBounds(bounds);
    }

    // Reconfigure gestures anytime the frame changes, because the panning bounds might
    // need to change
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
    var bounds = rect.union(element, this.bounds);
    this.setBounds(bounds);
  },

  resizeToFitAllElements: function() {
    var itemSelector = "." + services.constants.itemClassName;
    var elements = this.element.querySelectorAll(itemSelector);
    var bounds = rect.unionAll(elements);
    this.setBounds(bounds);
  },

  configureGestures: function() {
    var defaultOptions = this.defaultGestureOptions;
    var instanceOptions = {
      bounds: this.bounds
    };
    var layoutOptions = services.layout.getCanvasGestureOptions();
    var gestureOptions = _.merge({}, defaultOptions, instanceOptions, layoutOptions);

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
  }
});

module.exports = Canvas;
