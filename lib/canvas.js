var _ = require("lodash");
var binder = require("./events").binder;
var DecksEvent = require("./events").DecksEvent;
var hasEmitter = require("./events").hasEmitter;
var rect = require("./utils").rect;
var dom = require("./ui").dom;
var GestureHandler = require("./ui").GestureHandler;
var Layout = require("./layout");
var Frame = require("./frame");
var validate = require("./utils/validate");
var browser = require("./utils/browser");

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

  this.canvasId = _.uniqueId();
  this.padding = options.padding;
  this.debouncedOnWindowScroll = _.debounce(this.onWindowScroll, options.debouncedWindowScrollWait);
  this.debouncedOnWindowResize = _.debounce(this.onWindowResize, options.debouncedWindowResizeWait);

  this.setAnimator(options.animator);
  this.setConfig(options.config);
  this.setEmitter(options.emitter, this.emitterEvents);
  this.setLayout(options.layout);
  this.setElement(options.element || dom.create("div"));

  this.bindEvents(window, this.windowEvents);
}

_.extend(Canvas.prototype, binder, hasEmitter, /** @lends Canvas.prototype */ {
  defaultOptions: {
    padding: {
      right: 0,
      bottom: 0
    },
    debouncedWindowScrollWait: 200,
    debouncedWindowResizeWait: 200
  },

  emitterEvents: {
    "deck:layout:set": "onDeckLayoutSet",
    "frame:bounds:set": "onFrameBoundsSet",
    "viewport:render:drawing": "onViewportRenderDrawing",
    "viewport:render:erased": "onViewportRenderErased",
    "viewport:custom:render:drawing": "onViewportCustomRenderDrawing",
    "viewport:custom:render:erased": "onViewportCustomRenderErased",
    "viewport:all:renders:drawn": "onViewportAllRendersDrawn",
    "gesture:element:moved": "onGestureElementMoved"
  },

  windowEvents: {
    "resize": "debouncedOnWindowResize",
    "scroll": "debouncedOnWindowScroll"
  },

  defaultGestureHandlerOptions: {
    gestures: {
      pan: {
        // Only monitor pan events for desktop - mobile uses native browser touch gestures
        enabled: browser.isDesktop,
        horizontal: false,
        vertical: true
      },
      swipe: {
        // Only monitor swipe events for desktop - mobile uses native browser touch gestures
        enabled: browser.isDesktop,
        horizontal: false,
        vertical: true
      },
      scroll: {
        // Only monitor scroll events for mobile - the desktop uses Hammer pan/swipe to do gesture-based scrolling
        enabled: browser.isMobile
      }
    },
    movement: {
      scroll: true
    }
  },

  setAnimator: function(animator) {
    validate(animator, "Canvas#setAnimator: animator", { isPlainObject: true, isNotSet: this.animator });
    this.animator = animator;
  },

  setConfig: function(config) {
    validate(config, "Canvas#setConfig: config", { isPlainObject: true, isNotSet: this.config });
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
    validate(element, "Canvas#setElement: element", { isElement: true, isNotSet: this.element });

    if (!element.id) {
      element.id = this.config.canvasClassName + "-" + this.canvasId;
    }
    dom.addClass(element, this.config.canvasClassName);
    dom.setStyle(element, "position", "absolute");
    dom.setStyle(element, "top", 0);
    dom.setStyle(element, "left", 0);
    this.element = element;

    this.emit(DecksEvent("canvas:element:set", this, this.element));
  },

  setLayout: function(layout) {
    validate(layout, "Canvas#setLayout: layout", { isInstanceOf: Layout });
    this.layout = layout;
    this.configureGestures();
    this.resetPosition();
  },

  setBounds: function(bounds) {
    bounds = bounds || rect.normalize(this.element);

    if (rect.isEqual(this.bounds, bounds)) {
      return;
    }

    this.emit(DecksEvent("canvas:bounds:setting", this, { oldBounds: this.bounds, newBounds: bounds }));

    this.bounds = bounds;
    dom.setStyle(this.element, "width", this.bounds.width);
    dom.setStyle(this.element, "height", this.bounds.height);

    this.emit(DecksEvent("canvas:bounds:set", this, this.bounds));
  },

  setFrame: function(frame) {
    validate(frame, "Canvas#setFrame: frame", { isInstanceOf: Frame, isNotSet: this.frame });
    this.frame = frame;
  },

  setFrameBounds: function(frameBounds) {
    validate(frameBounds, "Canvas#setFrameBounds: frameBounds", { isRequired: true });

    if (rect.isEqual(this.frameBounds, frameBounds)) {
      return;
    }

    this.frameBounds = frameBounds;

    this.emit(DecksEvent("canvas:frame:bounds:set", this, this.frameBounds));

    // If the Canvas bounds are not set yet, use the Frame bounds
    if (!this.bounds) {
      this.setBounds(this.frameBounds);
    }

    // If a GestureHandler is already created, update it's bounds, otherwise
    // configure the GestureHandler now
    if (this.gestureHandler) {
      this.gestureHandler.setBounds(this.frameBounds);
    } else {
      this.configureGestures();
    }
  },

  /**
   * Adds a render (element) to the canvas, if not already added
   *
   * @param {Object} render render to remove
   * @return {undefined}
   */
  addRender: function(render) {
    validate(render, "Canvas#addRender: render", { isRequired: true });

    if (render.isInCanvas) {
      return;
    }

    validate(render.element, "Canvas#addRender: render.element", { isElement: true });

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
    validate(render, "Canvas#removeRender: render", { isRequired: true });

    if (!render.isInCanvas) {
      return;
    }

    validate(render.element, "Canvas#removeRender: render.element", { isElement: true });

    dom.remove(this.element, render.element);
    render.isInCanvas = false;

    this.emit(DecksEvent("canvas:render:removed", this, render));
  },

  resizeToFitElement: function(element) {
    validate(element, "Canvas#resizeToFitElement: element", { isElement: true });

    var bounds = rect.unionAll([element, this.bounds, this.frameBounds]);

    this.setBounds(bounds);
  },

  resizeToFitAllElements: function() {
    var itemSelector = "." + this.config.itemClassName;

    var elements = _.map(this.element.querySelectorAll(itemSelector), _.identity);

    if (_.isEmpty(elements)) {
      return;
    }

    var allElementsBounds = rect.unionAll(elements);
    var bounds = rect.union(allElementsBounds, this.frameBounds);

    this.setBounds(bounds);
  },

  resetPosition: function() {
    if (!this.gestureHandler) {
      return;
    }
    this.gestureHandler.resetPosition();
  },

  panToElement: function(element) {
    validate(element, "Canvas#panToElement: element", { isElement: true });
    this.gestureHandler.animateMoveToElement(element);
  },

  configureGestures: function() {
    if (!this.element || !this.frame) {
      if (this.config.debugGestures) {
        console.warn("Canvas#configureGestures: not configuring gestures - Canvas element or frame not set yet");
      }
      return;
    }

    var canvasGestureHandlerOptions = {
      animator: this.animator,
      config: this.config,
      emitter: this.emitter,
      element: this.element,
      containerElement: this.frame.element,
      bounds: this.frameBounds,
      getMoveToElementOffsets: _.bind(this.layout.getMoveToElementOffsets, this.layout)
    };

    var layoutGestureHandlerOptions = this.layout.getCanvasGestureOptions();

    var gestureHandlerOptions = _.merge({},
      this.defaultGestureHandlerOptions,
      canvasGestureHandlerOptions,
      layoutGestureHandlerOptions);

    if (this.gestureHandler) {
      this.gestureHandler.destroy();
    }

    this.gestureHandler = new GestureHandler(gestureHandlerOptions);
  },

  bindGestures: function() {
    if (!this.gestureHandler) {
      return;
    }
    this.gestureHandler.bindEvents();
  },

  unbindGestures: function() {
    if (!this.gestureHandler) {
      return;
    }
    this.gestureHandler.unbindEvents();
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

  onViewportRenderErased: function(e) {
    var render = e.data;
    this.removeRender(render);
  },

  onViewportAllRendersDrawn: function() {
    this.resizeToFitAllElements();
  },

  onViewportCustomRenderDrawing: function(e) {
    var customRender = e.data;
    this.addRender(customRender);
  },

  onViewportCustomRenderErased: function(e) {
    var customRender = e.data;
    this.removeRender(customRender);
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
