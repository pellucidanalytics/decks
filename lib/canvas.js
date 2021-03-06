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
  this.overflow = options.overflow;
  this.watchWindowResize = options.watchWindowResize;
  this.watchWindowScroll = options.watchWindowScroll;
  this.debouncedOnWindowResize = _.debounce(this.onWindowResize, options.debouncedWindowResizeWait);
  this.debouncedOnWindowScroll = _.debounce(this.onWindowScroll, options.debouncedWindowScrollWait);
  this.debouncedOnGestureElementMoved = _.debounce(this.onGestureElementMoved, options.debouncedOnGestureElementMovedWait);
  this.resetPositionOnFilter = options.resetPositionOnFilter;

  this.setAnimator(options.animator);
  this.setConfig(options.config);
  this.setEmitter(options.emitter);
  this.setLayout(options.layout);
  this.setElement(options.element || dom.create("div")); // Don't make this a defaultOptions - otherwise all Canvases will share it

  this.bind();

  this.emit(DecksEvent("canvas:ready", this));
}

_.extend(Canvas.prototype, binder, hasEmitter, /** @lends Canvas.prototype */ {
  /**
   * Default {@link Canvas} constructor options
   */
  defaultOptions: {
    overflow: "hidden",
    watchWindowScroll: true,
    watchWindowResize: true,
    debouncedWindowScrollWait: 200,
    debouncedWindowResizeWait: 200,
    debouncedOnGestureElementMovedWait: 200,
    resetPositionOnFilter: true
  },

  /**
   * Default options for the canvas GestureHandler
   */
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
        enabled: true
      }
    },
    movement: {
      scroll: true
    }
  },

  /**
   * Events to bind to on the main emitter
   */
  getEmitterEvents: function getEmitterEvents() {
    return {
      "deck:layout:set": "onDeckLayoutSet",
      "deck:resize": "onDeckResize",
      "item:collection:filter:set": "onItemCollectionFilterSet",
      "frame:bounds:set": "onFrameBoundsSet",
      "viewport:all:renders:drawn": "onViewportAllRendersDrawn",
      "gesture:element:moved": "debouncedOnGestureElementMoved"
    };
  },

  /**
   * Events to bind to on the window
   */
  getWindowEvents: function getWindowEvents() {
    var map = {};
    if (this.watchWindowResize) {
      map.resize = "debouncedOnWindowResize";
    }
    if (this.watchWindowScroll) {
      map.scroll = "debouncedOnWindowScroll";
    }
    return map;
  },

  /**
   * Binds {@link Canvas} event handlers.
   *
   * @return {undefined}
   */
  bind: function bind() {
    this.bindEvents(this.emitter, this.getEmitterEvents());
    this.bindEvents(window, this.getWindowEvents());
  },

  /**
   * Unbinds {@link Canvas} event handlers.
   *
   * @return {undefined}
   */
  unbind: function unbind() {
    this.unbindEvents(this.emitter, this.getEmitterEvents());
    this.unbindEvents(window, this.getWindowEvents());
  },

  /**
   * Binds the {@link GestureHandler} managed by the {@link Canvas}
   *
   * @return {undefined}
   */
  bindGestures: function bindGestureHandler() {
    if (this.gestureHandler) {
      this.gestureHandler.bind();
    }
  },

  /**
   * Unbinds the {@link GestureHandler} managed by the {@link Canvas}
   *
   * @return {undefined}
   */
  unbindGestures: function unbindGestureHandler() {
    if (this.gestureHandler) {
      this.gestureHandler.unbind();
    }
  },

  /**
   * Destroys the {@link Canvas}
   *
   * @return {undefined}
   */
  destroy: function destroy() {
    this.unbind();

    if (this.gestureHandler) {
      this.gestureHandler.destroy();
    }
  },

  /**
   * Sets the animator instance
   *
   * @param animator
   * @return {undefined}
   */
  setAnimator: function setAnimator(animator) {
    validate(animator, "Canvas#setAnimator: animator", { isPlainObject: true, isNotSet: this.animator });
    this.animator = animator;
  },

  /**
   * Sets the config object
   *
   * @param config
   * @return {undefined}
   */
  setConfig: function setConfig(config) {
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
  setElement: function setElement(element) {
    validate(element, "Canvas#setElement: element", { isElement: true, isNotSet: this.element });

    if (!element.id) {
      element.id = this.config.canvasClassName + "-" + this.canvasId;
    }

    dom.addClass(element, this.config.canvasClassName);
    dom.setStyle(element, "position", "absolute");
    dom.setStyle(element, "top", 0);
    dom.setStyle(element, "left", 0);
    dom.setStyle(element, "overflow", this.overflow);

    this.element = element;

    this.emit(DecksEvent("canvas:element:set", this, this.element));
  },

  /**
   * Sets the Layout instance, and reconfigures the Canvas based on Layout options
   *
   * @param layout
   * @return {undefined}
   */
  setLayout: function setLayout(layout) {
    validate(layout, "Canvas#setLayout: layout", { isInstanceOf: Layout });

    this.layout = layout;

    this.configureGestures();

    this.resetPosition();
  },

  /**
   * Sets the bounds of the Canvas (width and height).
   *
   * This uses the {@link Layout#getCanvasBoundsOptions} to apply some post-processing
   * to the bounds.  E.g. if the Layout wants extra padding at the right or bottom,
   * or wants to prevent overflow (so the {@link Canvas} doesn't create vertical or horizontal scrollbars
   * on the {@link Frame}).
   *
   * @param bounds
   * @return {undefined}
   */
  setBounds: function setBounds(bounds, options) {
    bounds = rect.normalize(bounds || this.element);
    options = options || {};

    // Ignore empty bounds (this can happen if the decks elements or ancestors become display: none)
    if (rect.isEmpty(bounds)) {
      return;
    }

    // Allow the Layout to control how the canvas bounds are set
    var layoutBoundsOptions = this.layout.getCanvasBoundsOptions();

    if (!options.noResize) {
      var applyMarginRight = true;
      var applyMarginBottom = true;

      if (layoutBoundsOptions.smartMarginRight || layoutBoundsOptions.smartMarginBottom) {
        // Smart margin right and bottom - only add margin if child elements are close to the edge
        // of the bounds
        var renderElementsBounds = this.getRenderElementsBounds();

        if (!renderElementsBounds) {
          // No child elements or no bounds - don't apply margins
          applyMarginRight = false;
          applyMarginBottom = false;
        } else {
          // Only add margin right if the child elements are close to the right edge of the bounds
          if (layoutBoundsOptions.smartMarginRight) {
            if (bounds.right - renderElementsBounds.right > layoutBoundsOptions.marginRight) {
              applyMarginRight = false;
            }
          }

          // Only add margin bottom if the child elements are close to the right edge of the bounds
          if (layoutBoundsOptions.smartMarginBottom) {
            if (bounds.bottom - renderElementsBounds.bottom > layoutBoundsOptions.marginBottom) {
              applyMarginBottom = false;
            }
          }
        }
      }

      // Add margin right and bottom to the bounds (from the layout canvas bounds options)
      if (applyMarginRight) {
        bounds = rect.resizeWidth(bounds, layoutBoundsOptions.marginRight);
      }

      if (applyMarginBottom) {
        bounds = rect.resizeHeight(bounds, layoutBoundsOptions.marginBottom);
      }

      if (this.frameBounds) {
        if (layoutBoundsOptions.preventOverflowHorizontal) {
          // Resize the canvas back to the frame width to prevent horizontal overflow
          bounds = rect.resizeToWidth(bounds, this.frameBounds.width);
        }
        if (layoutBoundsOptions.preventOverflowVertical) {
          // Resize the canvas back to the frame height to prevent vertical overflow
          bounds = rect.resizeToHeight(bounds, this.frameBounds.height);
        }
      }

      if (layoutBoundsOptions.preventScrollbarHorizontal) {
        // Reduce the width by a scrollbar width, so the presence of a vertical scrollbar
        // doesn't cause a horizontal scrollbar to appear
        bounds = rect.resizeWidth(bounds, -layoutBoundsOptions.scrollbarSize);
      }

      if (layoutBoundsOptions.preventScrollbarVertical) {
        // Reduce the height by a scrollbar size, so the presence of a horizontal scrollbar
        // doesn't cause the vertical scrollbar to appear
        bounds = rect.resizeHeight(bounds, -layoutBoundsOptions.scrollbarSize);
      }
    }

    if (rect.isEqual(this.bounds, bounds)) {
      return;
    }

    this.emit(DecksEvent("canvas:bounds:setting", this, { oldBounds: this.bounds, newBounds: bounds }));

    this.bounds = bounds;

    dom.setStyle(this.element, "width", this.bounds.width);
    dom.setStyle(this.element, "height", this.bounds.height);

    this.emit(DecksEvent("canvas:bounds:set", this, this.bounds));
  },

  /**
   * Sets the Frame instance on the Canvas
   *
   * @param frame
   * @return {undefined}
   */
  setFrame: function setFrame(frame) {
    validate(frame, "Canvas#setFrame: frame", { isInstanceOf: Frame, isNotSet: this.frame });

    this.frame = frame;
  },

  /**
   * Sets the Frame bounds
   *
   * @param frameBounds
   * @return {undefined}
   */
  setFrameBounds: function setFrameBounds(frameBounds) {
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
  addRender: function addRender(render) {
    validate(render, "Canvas#addRender: render", { isRequired: true });

    if (render.isInCanvas) {
      return;
    }

    validate(render.element, "Canvas#addRender: render.element", { isElement: true });


    if (this.element.contains(render.element)) {
      // TODO: this shouldn't happen, but seems to be happening with fast layout changes/filter changes/etc.
      console.warn("Canvas#addRender: Canvas element already contains render element - not re-adding", render.element);
    } else {
      dom.append(this.element, render.element);
    }

    render.isInCanvas = true;
  },

  /**
   * Removes a render (element) from the Canvas, if present.
   *
   * @param {Object} render render to remove
   * @return {undefined}
   */
  removeRender: function removeRender(render) {
    validate(render, "Canvas#removeRender: render", { isRequired: true });

    if (!render.isInCanvas) {
      return;
    }

    validate(render.element, "Canvas#removeRender: render.element", { isElement: true });

    if (!this.element.contains(render.element)) {
      // TODO: this shouldn't happen, but seems to be happening with fast layout changes/filter changes/etc.
      console.warn("Canvas#removeRender: Canvas element does not contain render element - not removing", render.element);
    } else {
      dom.remove(this.element, render.element);
    }

    render.isInCanvas = false;
  },

  /**
   * Gets the .decks-item elements inside the canvas as plain array.
   *
   * @return {HTMLElement[]}
   */
  getRenderElements: function() {
    var itemSelector = "." + this.config.itemClassName;
    // convert NodeList to a plain array
    return _.map(this.element.querySelectorAll(itemSelector), _.identity);
  },

  /**
   * Gets a rect that is the union of all the bounding client rects for all render elements.
   *
   * @return {Object} - the union of all element rects, or null if there are no elements.
   */
  getRenderElementsBounds: function() {
    var elements = this.getRenderElements();

    if (_.isEmpty(elements)) {
      return null;
    }

    return rect.unionAll(elements);
  },

  /**
   * Resizes the {@link Canvas} to fit the specified Element.
   *
   * @param element
   * @return {undefined}
   */
  resizeToFitElement: function resizeToFitElement(element) {
    validate(element, "Canvas#resizeToFitElement: element", { isElement: true });

    var bounds = rect.unionAll([element, this.bounds, this.frameBounds]);

    this.setBounds(bounds);
  },

  /**
   * Resizes the canvas to fit all of the .decks-item elements currently in the Canvas.
   *
   * @return {undefined}
   */
  resizeToFitAllElements: function resizeToFitAllElements() {
    var renderElementsBounds = this.getRenderElementsBounds();

    if (!renderElementsBounds) {
      return;
    }

    // Don't include this.bounds in this union - we want to resize to fit the current elements,
    // and don't care about the current canvas size
    var bounds = rect.union(renderElementsBounds, this.frameBounds);

    this.setBounds(bounds);
  },

  /**
   * Resets the postiion of the {@link Canvas} (top/left or scrollTop/scrollLeft)
   * to the default position (0, 0).
   *
   * This is handled by {@link GestureHandler#resetPosition}
   *
   * @return {undefined}
   */
  resetPosition: function resetPosition() {
    if (!this.gestureHandler) {
      return;
    }

    this.gestureHandler.resetPosition();
  },

  /**
   * Moves the {@link Canvas} to bring the specified element into view.
   *
   * This is handled by {@link GestureHandler#animateMoveToElement}
   *
   * @param element
   * @return {undefined}
   */
  panToElement: function panToElement(element) {
    validate(element, "Canvas#panToElement: element", { isElement: true });

    this.gestureHandler.animateMoveToElement(element);
  },

  /**
   * Configures the {@link Canvas} {@link GestureHandler} options.
   *
   * This is used to configure how the user can interact with the canvas through touch gestures,
   * or natural scrolling, and other Hammer.js or DOM events.
   *
   * The {@link Canvas} specifies default options, which can be overridden via {@link Layout#getCanvasGestureOptions}
   * per {@link Layout}.
   *
   * @return {undefined}
   */
  configureGestures: function configureGestures() {
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

  onDeckLayoutSet: function onDeckLayoutSet(e) {
    var layout = e.data;
    this.setLayout(layout);
  },

  onDeckResize: function onDeckResize() {
    this.setBounds();
  },

  onItemCollectionFilterSet: function onItemCollectionFilterSet() {
    var self = this;

    if (self.resetPositionOnFilter) {
      self.once("viewport:all:renders:drawn", function() {
        self.resetPosition();
      });
    }
  },

  onFrameBoundsSet: function onFrameBoundsSet(e) {
    var bounds = e.data;
    this.setFrameBounds(bounds);
  },

  onViewportAllRendersDrawn: function onViewportAllRendersDrawn() {
    this.resizeToFitAllElements();
  },

  onGestureElementMoved: function onGestureElementMoved(e) {
    var element = e.data;

    if (element !== this.element) {
      return;
    }

    this.setBounds(null, { noResize: true });
  },

  onWindowScroll: function onWindowScroll() {
    this.setBounds(null, { noResize: true });
  },

  onWindowResize: function onWindowResize() {
    this.setBounds(null, { noResize: true });
  }
});

module.exports = Canvas;
