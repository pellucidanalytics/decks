!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.decks=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require("./lib");

},{"./lib":10}],2:[function(require,module,exports){
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
        // Only monitor scroll events for mobile - the desktop uses Hammer pan/swipe to do gesture-based scrolling
        enabled: browser.isMobile
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
      "viewport:render:drawing": "onViewportRenderDrawing",
      "viewport:render:erased": "onViewportRenderErased",
      "viewport:custom:render:drawing": "onViewportCustomRenderDrawing",
      "viewport:custom:render:erased": "onViewportCustomRenderErased",
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

    // Allow the Layout to control how the canvas bounds are set
    var layoutBoundsOptions = this.layout.getCanvasBoundsOptions();

    if (!options.noResize) {
      // Add extra margin on the right and top (can be 0 or negative)
      bounds = rect.resizeWidth(bounds, layoutBoundsOptions.marginRight);
      bounds = rect.resizeHeight(bounds, layoutBoundsOptions.marginBottom);

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

    this.emit(DecksEvent("canvas:render:added", this, render));
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

    this.emit(DecksEvent("canvas:render:removed", this, render));
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
    var itemSelector = "." + this.config.itemClassName;

    // convert NodeList to a plain array
    var elements = _.map(this.element.querySelectorAll(itemSelector), _.identity);

    if (_.isEmpty(elements)) {
      return;
    }

    var allElementsBounds = rect.unionAll(elements);

    // Don't include this.bounds in this union - we want to resize to fit the current elements,
    // and don't care about the current canvas size
    var bounds = rect.union(allElementsBounds, this.frameBounds);

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
    if (this.resetPositionOnFilter) {
      this.resetPosition();
    }
  },

  onFrameBoundsSet: function onFrameBoundsSet(e) {
    var bounds = e.data;
    this.setFrameBounds(bounds);
  },

  onViewportRenderDrawing: function onViewportRenderDrawing(e) {
    var render = e.data;
    this.addRender(render);
  },

  onViewportRenderErased: function onViewportRenderErased(e) {
    var render = e.data;
    this.removeRender(render);
  },

  onViewportAllRendersDrawn: function onViewportAllRendersDrawn() {
    this.resizeToFitAllElements();
  },

  onViewportCustomRenderDrawing: function onViewportCustomRenderDrawing(e) {
    var customRender = e.data;
    this.addRender(customRender);
  },

  onViewportCustomRenderErased: function onViewportCustomRenderErased(e) {
    var customRender = e.data;
    this.removeRender(customRender);
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

},{"./events":8,"./frame":9,"./layout":13,"./ui":24,"./utils":34,"./utils/browser":33,"./utils/validate":36,"lodash":"lodash"}],3:[function(require,module,exports){
var _ = require("lodash");
var binder = require("./events").binder;
var hasEmitter = require("./events").hasEmitter;
var DecksEvent = require("./events").DecksEvent;
var Item = require("./item");
var ItemCollection = require("./itemcollection");
var Layout = require("./layout");
var Canvas = require("./canvas");
var Frame = require("./frame");
var Viewport = require("./viewport");
var validate = require("./utils/validate");

/**
 * Creates the {@link Deck} object, which is the top-level API for managing the decks system.
 * Contains all of the coordinating objects for managing items, collections of items,
 * viewports, layouts, etc.
 *
 * @class
 * @mixes binder
 * @mixes hasEmitter
 * @param {!Object} options - Deck options
 * @param {?Object} [options.config={}] - Deck configuration settings
 * @param {?boolean} [options.config.debugEvents=false] - Whether to log events to the console
 * @param {?boolean} [options.config.debugDrawing=false] - Whether to log drawing actions to the console
 * @param {?boolean} [options.config.debugGestures=false] - Whether to log gesture info to the console
 * @param {?(Object|Emitter)} [options.emitter={}] - Emitter instance or options
 * @param {!Object} options.animator - Object with animate function (like VelocityJS)
 * @param {?(Object|ItemCollection)} [options.itemCollection=[]] - ItemCollection instance or options
 * @param {!(Object|Layout)} options.layout - Layout instance or options
 * @param {!(Object|Frame)} options.frame - Frame instance or options
 * @param {?(Object|Canvas)} [options.canvas={}] - Canvas instance or options
 * @param {?(Object|Viewport)} [options.viewport={}] - Viewport instance or options
 */
function Deck(options) {
  if (!(this instanceof Deck)) {
    return new Deck(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  validate.isEnabled = !!options.config.validation;

  this.setEmitter(options.emitter || {});
  this.setConfig(options.config || {});
  this.setAnimator(options.animator);
  this.setItemCollection(options.itemCollection || options.items || []);
  this.setFilter(options.filter);
  this.setSortBy(options.sortBy);
  this.setReversed(!!options.reversed);
  this.setLayout(options.layout);
  this.setFrame(options.frame);
  this.setCanvas(options.canvas || {});
  this.setViewport(options.viewport || {});

  this.bind();

  this.emit(DecksEvent("deck:ready", this));
}

_.extend(Deck.prototype, binder, hasEmitter, /** @lends Deck.prototype */ {
  /**
   * Default global {@link Deck} options.
   */
  defaultOptions: {
    config: {
      frameClassName: "decks-frame",
      canvasClassName: "decks-canvas",
      itemClassName: "decks-item",
      customRenderClassName: "decks-custom-render",
      debugEvents: false,
      debugDrawing: false,
      debugGestures: false,
      debugLoading: false,
      validation: true
    }
  },

  /**
   * Events to bind to on the shared {@link Emitter}.
   */
  getEmitterEvents: function getEmitterEvents() {
    return {
      "*": "onAnyEmitterEvent"
    };
  },

  /**
   * Events to bind to on the {@link ItemCollection}
   */
  getItemCollectionEvents: function getItemCollectionEvents() {
    return {
      "*": "onAnyItemCollectionEvent"
    };
  },

  /**
   * Binds the {@link Emitter} and {@link ItemCollection} event handlers.
   *
   * @return {undefined}
   */
  bind: function bind() {
    this.bindEvents(this.emitter, this.getEmitterEvents());

    if (this.itemCollection.emitter !== this.emitter) {
      this.bindEvents(this.itemCollection, this.getItemCollectionEvents());
    }
  },

  /**
   * Unbinds the {@link Emitter} and {@link ItemCollection} event handlers.
   *
   * @return {undefined}
   */
  unbind: function unbind() {
    this.unbindEvents(this.emitter, this.getEmitterEvents());

    if (this.itemCollection.emitter !== this.emitter) {
      this.unbindEvents(this.itemCollection, this.getItemCollectionEvents());
    }
  },

  /**
   * Binds the {@link Layout} {@link Emitter} events.
   *
   * @return {undefined}
   */
  bindLayout: function bindLayout() {
    this.layout.bindEvents(this.emitter, this.layout.getEmitterEvents());
  },

  /**
   * Unbinds the {@link Layout} {@link Emitter} events.
   *
   * @return {undefined}
   */
  unbindLayout: function unbindLayout() {
    this.layout.unbindEvents(this.emitter, this.layout.getEmitterEvents());
  },

  /**
   * Binds all {@link GestureHandler}s and {@link GestureHandlerGroup}s.
   *
   * @return {undefined}
   */
  bindGestures: function bindGestures() {
    this.canvas.bindGestures();
    this.viewport.bindGestures();
  },

  /**
   * Binds all {@link GestureHandler}s and {@link GestureHandlerGroup}s.
   *
   * @return {undefined}
   */
  unbindGestures: function unbindCanvasGestureHandler() {
    this.canvas.unbindGestures();
    this.viewport.unbindGestures();
  },

  /**
   * Destroys the {@link Deck} and all sub-components.  The {@link Deck} is no longer
   * usable after calling this.
   *
   * @return {undefined}
   */
  destroy: function destroy() {
    this.unbind();
    this.unbindLayout();

    this.itemCollection.destroy();
    this.layout.destroy();
    this.frame.destroy();
    this.canvas.destroy();
    this.viewport.destroy();
  },

  /**
   * Enables drawing (if it had previously been disabled with {@link Viewport#disableDrawing}
   *
   * @return {undefined}
   */
  enableDrawing: function enableDrawing() {
    this.viewport.enableDrawing();
  },

  /**
   * Disables drawing (re-enable by calling {@link Viewport#enableDrawing}
   *
   * @return {undefined}
   */
  disableDrawing: function disableDrawing() {
    this.viewport.disableDrawing();
  },

  /**
   * Gets {@link Item}s from the {@link ItemCollection}
   *
   * @param {?Function} [filter=undefined] - optional filter function which takes an {@link Item}
   * @return {undefined}
   */
  getItems: function getItems(filter) {
    return this.itemCollection.getItems(filter);
  },

  /**
   * Gets an {@link Item} by {@link Item} id
   *
   * @param id
   * @return {undefined}
   */
  getItem: function getItem(id) {
    return this.itemCollection.getItem(id);
  },

  /**
   * Adds an {@link Item} to the {@link ItemCollection}
   *
   * @param item
   * @param options
   * @return {undefined}
   */
  addItem: function addItem(item, options) {
    this.itemCollection.addItem(item, options);
  },

  /**
   * Adds {@link Item}s to the {@link ItemCollection}
   *
   * @param items
   * @param options
   * @return {undefined}
   */
  addItems: function addItems(items, options) {
    this.itemCollection.addItems(items, options);
  },

  /**
   * Removes an {@link Item} from the {@link ItemCollection}.
   *
   * @param item
   * @param options
   * @return {undefined}
   */
  removeItem: function removeItem(item, options) {
    this.itemCollection.removeItem(item, options);
  },

  /**
   * Clears all {@link Item}s from the {@link ItemCollection}
   *
   * @param options
   * @return {undefined}
   */
  clear: function clear(options) {
    this.itemCollection.clear(options);
  },

  /**
   * Sets a filter function on the {@link ItemCollection}.  Items that do not pass the filter
   * function will have their {@link Item} index set to -1, which may cause the renders for the
   * {@link Item} to be hidden on the next draw cycle.
   *
   * @param filter
   * @return {undefined}
   */
  setFilter: function setFilter(filter, options) {
    this.itemCollection.setFilter(filter, options);
  },

  /**
   * Sets a sort by function on the {@link ItemCollection}.  The sort by function will be run over
   * the {@link ItemCollection} and may cause the indices to change on zero or more {@link Item}s.
   * This triggers a redraw for any {@link Item} whose index changes.
   *
   * @param sortBy
   * @return {undefined}
   */
  setSortBy: function setSortBy(sortBy, options) {
    this.itemCollection.setSortBy(sortBy, options);
  },

  /**
   * Sets a reversed flag on the {@link ItemCollection} which reverses all the indices of the {@link Item}s.
   * This triggers a redraw if any {@link Item} indices change.
   *
   * @param isReversed
   * @return {undefined}
   */
  setReversed: function setReversed(isReversed, options) {
    this.itemCollection.setReversed(isReversed, options);
  },

  /**
   * Requests a manual redraw and reload cycle on all the items.
   *
   * This is normally not needed, as decks will attempt to always redraw and reload
   * whenever necessary, but can be used to force a redraw/reload to happen.
   *
   * @return {undefined}
   */
  draw: function draw() {
    this.emit(DecksEvent("deck:draw", this));
  },

  /**
   * Requests that the {@link Frame} re-calculate it's bounds.  If the bounds have changed,
   * it will trigger a redraw, which allows the {@link Viewport} to request new renders from
   * the {@link Layout} which might result in renders moving to fit in the new {@link Frame} size.
   *
   * @return {undefined}
   */
  resize: function resize() {
    this.emit(DecksEvent("deck:resize", this));
  },

  /**
   * Pans the {@link Canvas} to the given {@link Item}, with an optional render id (defaults to the first render element).
   *
   * @param {!(Item|string)} itemOrItemId - the item or item id to pan to
   * @param {?(string|number)} [renderIdOrIndex=0] - the render id or index of the element to pan to
   * * (defaults to the first render element for the item)
   * @return {undefined}
   */
  panToItem: function panToItem(itemOrItemId, renderIdOrIndex) {
    var item;
    if (itemOrItemId instanceof Item) {
      item = itemOrItemId;
    } else if (_.isString(itemOrItemId)) {
      item = this.getItem(itemOrItemId);
    } else if (_.isNumber(itemOrItemId)) {
      item = this.getItem("" + itemOrItemId);
    } else if (_.has(itemOrItemId, "id")) {
      var id = itemOrItemId.id;
      if (_.isNumber(id)) {
        id = "" + id;
      }
      item = this.getItem(id);
    }
    this.viewport.panToItem(item, renderIdOrIndex);
  },

  /**
   * Sets a new {@link Layout}, and pans to the given {@link Item} when the new layout draw cycle completes.
   *
   * @param {Layout} layout - new layout to set
   * @param {!(Item|string)} itemOrItemId - item or item id
   * @param {?(string|number)} [renderIdOrIndex=0] - render id or index (defaults to the first render for the {@link Item})
   * @return {undefined}
   */
  setLayoutAndPanToItem: function setLayoutAndPanToItem(layout, itemOrItemId, renderIdOrIndex) {
    var self = this;

    // Listen for the completion of the next drawing cycle (this should be emitted when
    // the drawing cycle for new layout completes).  At that point, pan to the item.
    self.once("viewport:all:renders:drawn", function() {
      self.panToItem(itemOrItemId, renderIdOrIndex);
    });

    self.setLayout(layout);
  },

  /**
   * Sets the config object.
   *
   * @param config
   * @return {undefined}
   */
  setConfig: function setConfig(config) {
    validate(config, "config", { isPlainObject: true, isNotSet: this.config });

    this.config = config;

    this.emit(DecksEvent("deck:config:set", this, this.config));
  },

  /**
   * Sets the animator object.
   *
   * @param animator
   * @return {undefined}
   */
  setAnimator: function setAnimator(animator) {
    validate(animator, "animator", { isPlainObject: true, isNotSet: this.animator });

    this.animator = animator;

    this.emit(DecksEvent("deck:animator:set", this, this.animator));
  },

  /**
   * Sets the {@link ItemCollection}.
   *
   * @param itemCollection
   * @return {undefined}
   */
  setItemCollection: function setItemCollection(itemCollection) {
    validate(itemCollection, "itemCollection", { isRequired: true, isNotSet: this.itemCollection });

    if (!(itemCollection instanceof ItemCollection)) {
      itemCollection = new ItemCollection(itemCollection);
    }

    this.itemCollection = itemCollection;

    this.emit(DecksEvent("deck:item:collection:set", this, this.layout));
  },

  /**
   * Sets the {@link Layout}
   *
   * @param layout
   * @return {undefined}
   */
  setLayout: function setLayout(layout) {
    validate(layout, "layout", { isRequired: true });

    if (this.layout === layout) {
      return;
    }

    this.emit(DecksEvent("deck:layout:setting", this, { oldLayout: this.layout, newLayout: layout }));

    // Unbind the previous layout from emitter events
    if (this.layout) {
      this.unbindLayout();
    }

    if (!(layout instanceof Layout)) {
      layout = new Layout(layout);
    }

    this.layout = layout;
    this.bindLayout();

    this.emit(DecksEvent("deck:layout:set", this, this.layout));
  },

  /**
   * Sets the {@link Frame}
   *
   * @param frame
   * @return {undefined}
   */
  setFrame: function setFrame(frame) {
    validate(frame, "frame", { isRequired: true, isNotSet: this.frame });

    if (!(frame instanceof Frame)) {
      _.extend(frame, {
        emitter: this.emitter,
        config: this.config,
        animator: this.animator
      });
      frame = new Frame(frame);
    }

    this.frame = frame;

    this.emit(DecksEvent("deck:frame:set", this, this.frame));
  },

  /**
   * Sets the {@link Canvas}
   *
   * @param canvas
   * @return {undefined}
   */
  setCanvas: function setCanvas(canvas) {
    validate(canvas, "canvas", { isRequired: true, isNotSet: this.canvas });

    if (!(canvas instanceof Canvas)) {
      _.extend(canvas, {
        emitter: this.emitter,
        config: this.config,
        animator: this.animator,
        layout: this.layout
      });
      canvas = new Canvas(canvas);
    }

    this.canvas = canvas;

    this.emit(DecksEvent("deck:canvas:set", this, this.canvas));
  },

  /**
   * Sets the {@link Viewport}
   *
   * @param viewport
   * @return {undefined}
   */
  setViewport: function setViewport(viewport) {
    validate(viewport, "viewport", { isRequired: true, isNotSet: this.viewport });

    if (!(viewport instanceof Viewport)) {
      _.extend(viewport, {
        emitter: this.emitter,
        config: this.config,
        animator: this.animator,
        deck: this,
        itemCollection: this.itemCollection,
        layout: this.layout,
        frame: this.frame,
        canvas: this.canvas
      });
      viewport = new Viewport(viewport);
    }

    this.viewport = viewport;

    this.emit(DecksEvent("deck:viewport:set", this, this.viewport));
  },

  /**
   * Called on any {@link Emitter} event.
   *
   * @param e
   * @return {undefined}
   */
  onAnyEmitterEvent: function onAnyEmitterEvent(e) {
    if (this.config.debugEvents) {
      console.log("Deck#onAnyEmitterEvent:", e);
    }
  },

  /**
   * Called on any {@link ItemCollection} event.
   *
   * @param e
   * @return {undefined}
   */
  onAnyItemCollectionEvent: function onAnyItemCollectionEvent(e) {
    // Forward itemCollection events on the main Deck emitter
    this.emit(e);
  }
});

module.exports = Deck;

},{"./canvas":2,"./events":8,"./frame":9,"./item":11,"./itemcollection":12,"./layout":13,"./utils/validate":36,"./viewport":37,"lodash":"lodash"}],4:[function(require,module,exports){
var _ = require("lodash");
var Emitter = require("./emitter");
var validate = require("../utils/validate");
var browser = require("../utils/browser");

/**
 * Mixin for objects that need to bind to events from a source object,
 * and wish to handle events with member functions.
 *
 * @mixin
 */
var binder = {
  /**
   * Binds events from the source object to a handler method on 'this' object.
   * The handler method is automatically bound to 'this', and stored on 'this' using
   * a prefixed method name, based on the original method name.
   *
   * @instance
   * @param {!*} source object which emits an event, and can be subscribed to.
   * @param {!Object} eventToMethodMap hash of event name to method name of this.
   * @return {undefined}
   */
  bindEvents: function bindEvents(source, eventToMethodMap) {
    validate(source, "source", { isRequired: true });
    validate(eventToMethodMap, "eventToMethodMap", { isPlainObject: true });

    _.each(eventToMethodMap, function(methodName, eventName) {
      if (!_.isFunction(this[methodName])) {
        throw new Error("binder#bindEvents: event target object does not have a method named " + methodName);
      }

      var eventNames = this.getEventNames(eventName);

      _.each(eventNames, function(eventName) {
        var onMethodName = this.getOnMethodName(source);

        if (source instanceof Emitter) {
          // Assuming the on method supports a context arg, so we don't need to _.bind the method
          source[onMethodName](eventName, this[methodName], this);
        } else {
          // Not assuming the on method supports a context arg, so we need to _.bind the method
          var boundMethodName = this.getBoundMethodName(methodName);
          if (!_.isFunction(this[boundMethodName])) {
            this[boundMethodName] = _.bind(this[methodName], this);
          }

          // IE8 prefixes the event name with "on"
          if (onMethodName === "attachEvent") {
            eventName = "on" + eventName;
          }

          source[onMethodName](eventName, this[boundMethodName]);
        }
      }, this);
    }, this);
  },

  /**
   * Unbinds from events from a given source object, which were previously bound using bindEvents.
   *
   * @instance
   * @param {!*} source source object that emits events
   * @param {!Object} eventToMethodMap hash of event names to method names of 'this'
   * @return {undefined}
   */
  unbindEvents: function unbindEvents(source, eventToMethodMap) {
    validate(source, "source", { isRequired: true });
    validate(eventToMethodMap, "eventToMethodMap", { isPlainObject: true });

    _.each(eventToMethodMap, function(methodName, eventName) {
      var eventNames = this.getEventNames(eventName);

      _.each(eventNames, function(eventName) {
        var offMethodName = this.getOffMethodName(source, eventName);

        if (source instanceof Emitter) {
          // Assuming the off method supports a context arg, so we don't need to _.bind the method
          source[offMethodName](eventName, this[methodName], this);
        } else {
          // Not assuming the off method supports a context arg, get the _.bind copy of the method
          var boundMethodName = this.getBoundMethodName(methodName);
          if (!this[boundMethodName]) {
            return;
          }

          // IE8 prefixes event names with "on" (e.g. onmouseup)
          if (offMethodName === "detachEvent") {
            eventName = "on" + eventName;
          }

          source[offMethodName](eventName, this[boundMethodName]);
        }
      }, this);
    }, this);
  },

  /**
   * Tries to find a method on the source object which can be used to bind events.
   *
   * @instance
   * @param {!*} source object that emits events
   * @return {String} first method name that could be used to bind events.
   */
  getOnMethodName: function getOnMethodName(source) {
    var name = _.find(["on", "addListener", "addEventListener", "attachEvent"], function(name) {
      // "attachEvent" is not a "function" in IE8 (WTF)
      return _.isFunction(source[name]) || (browser.isIE8 && source[name]);
    });

    if (!name) {
      throw new Error("binder#getOnMethodName: event source object does not have an event binding method");
    }

    return name;
  },

  /**
   * Tries to find a method on the source object which can be used to unbind events.
   *
   * @instance
   * @param {!*} source object which emits events
   * @return {String} first method name that could be used to unbind events.
   */
  getOffMethodName: function getOffMethodName(source) {
    var name = _.find(["off", "removeListener", "removeEventListener", "detachEvent"], function(name) {
      // "detachEvent" is not a "function" in IE8 (WTF)
      return _.isFunction(source[name]) || (browser.isIE8 && source[name]);
    });

    if (!name) {
      throw new Error("binder#getOffMethodName: event source object does not have an event unbinding method");
    }

    return name;
  },

  /**
   * Splits an event name by " " into possibly multiple event names
   *
   * @instance
   * @param {String} eventName - single or space-delimited event name(s)
   * @return {String[]} - array of event names
   */
  getEventNames: function getEventNames(eventName) {
    eventName = eventName || "";

    return _(eventName.split(" "))
      .map(function(name) {
        return name.trim();
      })
      .filter(function(name) {
        return name.length > 0;
      })
      .value();
  },

  /**
   * Creates a method name to use for binding a member event handler function to
   * the target instance.  E.g. if your target has a method named "onItemChanged", this method
   * will return a new function name like "_bound_onItemChanged" which can be used as a new
   * member name to store the bound member function.
   *
   * @param {String} methodName method name to prefix
   * @return {String} prefixed method name
   */
  getBoundMethodName: function getBoundMethodName(methodName) {
    return "_bound_" + methodName;
  }
};

module.exports = binder;

},{"../utils/browser":33,"../utils/validate":36,"./emitter":6,"lodash":"lodash"}],5:[function(require,module,exports){
var validate = require("../utils/validate");

/**
 * A custom event class for use within decks.js
 *
 * @class
 * @param {!String} type - The type of event (e.g. "item:changed")
 * @param {!*} sender - The sender of the event (e.g. the object which is emitting the event)
 * @param {?*} [data={}] - Custom data to include with the event (any type, Object, array, primitive, etc.)
 */
function DecksEvent(type, sender, data) {
  validate(type, "type", { isString: true });
  validate(sender, "sender", { isRequired: true });

  if (!(this instanceof DecksEvent)) {
    return new DecksEvent(type, sender, data);
  }

  /** The type of event */
  this.type = type;

  /** The sender of the event (the object that emitted the event) */
  this.sender = sender;

  /** Custom event data (can be anything) */
  this.data = data || {};
}

module.exports = DecksEvent;

},{"../utils/validate":36}],6:[function(require,module,exports){
var _ = require("lodash");
var EventEmitter3 = require("eventemitter3");
var DecksEvent = require("./decksevent");

// Keep a refenrence to the super EventEmitter* prototype for faster access
var superPrototype = EventEmitter3.prototype;
var superPrototypeEmit = superPrototype.emit;
var superPrototypeOn = superPrototype.on;
var superPrototypeOff = superPrototype.off;

/**
 * Custom event emitter implementation, that extends EventEmitter3
 *
 * @class
 * @extends external:EventEmitter3
 * @param {Object} [options={}] - configuration options
 */
function Emitter(options) {
  if (!(this instanceof Emitter)) {
    return new Emitter(options);
  }

  superPrototype.constructor.call(this);

  options = _.merge({}, this.defaultOptions, options);

  /**
   * Generated unique id for the Emitter.  This is to help with debugging when multiple
   * Emitter instances are being used
   */
  this._emitterId = _.uniqueId();

  /**
   * Wildcard for subscribing to any event
   */
  this._wildcard = options.wildcard;

  /**
   * List of listeners for any event
   */
  this._anyListeners = [];
}

Emitter.prototype = _.create(superPrototype, /** @lends Emitter.prototype */ {
  constructor: Emitter,

  /**
   * Default options for the Emitter instance.
   */
  defaultOptions: {
    wildcard: "*"
  },

  /**
   * Overrides the EventEmitter3 emit method to support a single {@link DecksEvent} argument,
   * which contains the event type as a property, along with other properties.
   *
   * @param {!(String|DecksEvent)} typeOrDecksEvent - event type String, or {@link DecksEvent} instance.
   * @param {...*} data - if the first argument is a String, the remaining arguments are emitted as the event data.
   * This argument is N/A if the first argument is a {@link DecksEvent} instance.
   * @return {boolean} - true if at least one handler was invoked for the event, otherwise false
   */
  emit: function emit() {
    var self = this;

    // If the arg is a DecksEvent, use the event.type as the emit type argument
    if (arguments.length === 1 && (arguments[0] instanceof DecksEvent)) {
      var decksEvent = arguments[0];

      _.each(this._anyListeners, function(anyListener) {
        anyListener.fn.call(anyListener.context || self, decksEvent);
      });

      superPrototypeEmit.call(this, decksEvent.type, decksEvent);
      return;
    }

    // Invoke any listeners (strip off the event "type" argument)
    var args = Array.prototype.slice.call(arguments, 1);
    _.each(this._anyListeners, function(anyListener) {
      anyListener.fn.apply(anyListener.context || self, args);
    });

    superPrototypeEmit.apply(this, arguments);
  },

  /**
   * Wraps the super "on" method, and adds support for using event "*" to subscribe to any event.
   *
   * @param {String} event - event name or "*"
   * @param {Function} fn - event listener callback function
   * @param {*} context - context to use for invoking callback function
   * @return {undefined}
   */
  on: function on(event, fn, context) {
    if (event === this._wildcard) {
      this.onAny(fn, context);
      return;
    }

    superPrototypeOn.call(this, event, fn, context);
  },

  /**
   * Wraps the super "off" method, and adds support for using event "*" to unsubscribe from any event.
   *
   * @param {String} event - event name or "*"
   * @param {Function} fn - callback function
   * @param {*} context - context for callback function
   * @return {undefined}
   */
  off: function off(event, fn, context) {
    if (event === this._wildcard) {
      this.offAny(fn, context);
      return;
    }

    // Note: do not pass context here - it's expecting "once" value, which we're not doing right now
    superPrototypeOff.call(this, event, fn);
  },

  /**
   * Extension to EventEmitter3 to subscribe to any event.
   */
  onAny: function onAny(fn, context) {
    this._anyListeners.push({
      fn: fn,
      context: context
    });
  },

  /**
   * Extension to EventEmitter3 to unsubscribe from any event.
   */
  offAny: function offAny(fn, context) {
    this._anyListeners = _.filter(this._anyListeners, function(anyListener) {
      return !(anyListener.fn === fn && anyListener.context === context);
    });
  }
});

module.exports = Emitter;

},{"./decksevent":5,"eventemitter3":"eventemitter3","lodash":"lodash"}],7:[function(require,module,exports){
var Emitter = require("./emitter");
var validate = require("../utils/validate");

/**
 * Mixin for objects that have an {@link Emitter} instance.  Exposes key {@link Emitter} methods,
 * and calls through to this.emitter.
 *
 * This is just for convenience and consistency for objects that have an {@link Emitter}.
 *
 * @mixin
 */
var hasEmitter = {
  /**
   * Sets an emitter instance on 'this' and optionally binds events from
   *
   * @instance
   * @param {!(Object|Emitter)} emitter - Emitter instance or options
   * @returns {undefined}
   */
  setEmitter: function setEmitter(emitter) {
    validate(emitter, "emitter", { isRequired: true, isNotSet: this.emitter });

    if (!(emitter instanceof Emitter)) {
      emitter = new Emitter(emitter);
    }

    this.emitter = emitter;
  },

  /**
   * Calls through to {@link Emitter#emit}
   *
   * @instance
   */
  emit: function emit() {
    this.emitter.emit.apply(this.emitter, arguments);
  },

  /**
   * Calls through to {@link Emitter#on}
   *
   * @instance
   */
  on: function on() {
    this.emitter.on.apply(this.emitter, arguments);
  },

  /**
   * Calls through to {@link Emitter#off}
   *
   * @instance
   */
  off: function off() {
    this.emitter.off.apply(this.emitter, arguments);
  },

  /**
   * Calls through to {@link Emitter#onAny}
   *
   * @instance
   */
  onAny: function onAny() {
    this.emitter.onAny.apply(this.emitter, arguments);
  },

  /**
   * Calls through to {@link Emitter#offAny}
   *
   * @instance
   */
  offAny: function offAny() {
    this.emitter.offAny.apply(this.emitter, arguments);
  },

  /**
   * Calls through to {@link Emitter#once}
   */
  once: function once() {
    this.emitter.once.apply(this.emitter, arguments);
  }
};

module.exports = hasEmitter;

},{"../utils/validate":36,"./emitter":6}],8:[function(require,module,exports){
/**
 * Index module for events classes/mixins/etc.
 *
 * @module decks/events
 */
module.exports = {
  /**
   * Provides access to the {@link binder} mixin.
   */
  binder: require("./binder"),

  /**
   * Provides access to the {@link DecksEvent} class.
   */
  DecksEvent: require("./decksevent"),

  /**
   * Provides access to the {@link Emitter} class.
   */
  Emitter: require("./emitter"),

  /**
   * Provides access to the {@link hasEmitter} mixin.
   */
  hasEmitter: require("./hasemitter")
};

},{"./binder":4,"./decksevent":5,"./emitter":6,"./hasemitter":7}],9:[function(require,module,exports){
var _ = require("lodash");
var binder = require("./events").binder;
var hasEmitter = require("./events").hasEmitter;
var DecksEvent = require("./events").DecksEvent;
var rect = require("./utils").rect;
var dom = require("./ui").dom;
var validate = require("./utils/validate");

/**
 * Represents the Viewport Frame.  The Frame is essentially a DOM element which acts as the
 * visible portion of the decks system.  The Frame is always set to position relative, and
 * overflow hidden.  The Frame contains a Canvas (element), which can move around within the
 * Frame element.  The Frame crops the content of the Canvas at the Frame edges.
 *
 * @class
 * @mixes binder
 * @mixes hasEmitter
 * @param {!Object} options Frame options
 * @param {!HTMLElement} options.element Frame container element
 * @param {?(Canvas|Object)} options.canvas Frame canvas instance or options
 */
function Frame(options) {
  if (!(this instanceof Frame)) {
    return new Frame(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  this.frameId = _.uniqueId();
  this.position = options.position;
  this.overflow = options.overflow;
  this.watchWindowResize = options.watchWindowResize;
  this.watchWindowScroll = options.watchWindowScroll;
  this.debouncedOnWindowResize = _.debounce(this.onWindowResize, options.debouncedWindowResizeWait);
  this.debouncedOnWindowScroll = _.debounce(this.onWindowScroll, options.debouncedWindowScrollWait);

  this.setConfig(options.config);
  this.setEmitter(options.emitter);
  this.setElement(options.element);

  this.bind();

  this.emit(DecksEvent("frame:ready", this));
}

_.extend(Frame.prototype, binder, hasEmitter, /** @lends Frame.prototype */ {
  defaultOptions: {
    position: "relative",
    overflow: "auto",
    watchWindowResize: true,
    watchWindowScroll: true,
    debouncedWindowResizeWait: 200,
    debouncedWindowScrollWait: 200
  },

  /**
   * Gets the {@link Emitter} events map.
   *
   * @return {Object}
   */
  getEmitterEvents: function() {
    return {
      "canvas:element:set": "onCanvasElementSet",
      "deck:resize": "onDeckResize"
    };
  },

  /**
   * Gets the window events map.
   *
   * @return {Object}
   */
  getWindowEvents: function() {
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
   * Binds the {@link Emitter} and window events.
   *
   * @return {undefined}
   */
  bind: function bind() {
    this.bindEvents(this.emitter, this.getEmitterEvents());
    this.bindEvents(window, this.getWindowEvents());
  },

  /**
   * Unbinds the {@link Emitter} and window events.
   *
   * @return {undefined}
   */
  unbind: function unbind() {
    this.unbindEvents(this.emitter, this.getEmitterEvents());
    this.unbindEvents(window, this.getWindowEvents());
  },

  /**
   * Destroys the {@link Frame}
   *
   * @return {undefined}
   */
  destroy: function() {
    this.unbind();
  },

  /**
   * Sets the config object.
   *
   * @param config
   * @return {undefined}
   */
  setConfig: function setConfig(config) {
    validate(config, "config", { isPlainObject: true, isNotSet: this.config });

    this.config = config;
  },

  /**
   * Sets the Frame's DOM element (container)
   *
   * @param {HTMLElement} element the Frame's main container element
   * @param {Object} options frame options
   * @return {undefined}
   */
  setElement: function setElement(element) {
    validate(element, "element", { isElement: true, isNotSet: this.element });

    this.element = element;

    if (!element.id) {
      this.element.id = this.config.frameClassName + "-" + this.frameId;
    }

    dom.addClass(this.element, this.config.frameClassName);

    // Frame must be positioned (absolute, relative or fixed), so that the Canvas can be positioned within it
    if (!dom.isPositioned(this.element)) {
      dom.setStyle(this.element, "position", this.position);
    }

    dom.setStyle(this.element, "overflow", this.overflow);

    this.emit(DecksEvent("frame:element:set", this, element));

    this.setBounds();
  },

  /**
   * Sets the frame size parameters
   *
   * @param options
   * @return {undefined}
   */
  setBounds: function setBounds() {
    var bounds = rect.normalize(this.element);

    if (rect.isEqual(this.bounds, bounds)) {
      return;
    }

    this.emit(DecksEvent("frame:bounds:setting", this, { oldBounds: this.bounds, newBounds: bounds }));

    this.bounds = bounds;

    this.emit(DecksEvent("frame:bounds:set", this, this.bounds));
  },

  /**
   * Indicates if the given element is currently visible within the
   * Frame's container element.  This might be a combination of the element's
   * bounding rect being inside the Frame element, and stacking like z-index.
   *
   * @param {HTMLElement} element element to check for visibility
   * @return {boolean} whether the element is visible in the Frame
   */
  isElementVisible: function isElementVisible(element) {
    validate(element, "element", { isElement: true });

    return rect.intersects(this.element, element);
  },

  /**
   * Called when the {@link Canvas} element has been set.
   *
   * This appends the {@link Canvas} element in the {@link Frame} element, and also
   * initializes the {@link Canvas} with the {@link Frame} and {@link Frame} bounds.
   *
   * @param e
   * @return {undefined}
   */
  onCanvasElementSet: function onCanvasElementSet(e) {
    var canvas = e.sender;
    var canvasElement = e.data;

    // Add the Canvas element to the Frame element
    dom.empty(this.element);
    dom.append(this.element, canvasElement);

    // Set the initial canvas bounds to match the frame
    // TODO: there might be a better way to do this - the problem is that the Frame bounds are
    // set and an event is emitted before the Canvas has been instantiated, and there is somewhat
    // of a circular dependency between Frame and Canvas.
    canvas.setFrame(this);
    canvas.setFrameBounds(this.bounds);
  },

  /**
   * Called when a deck:resize event is received.  This event is used by the caller
   * to request that the {@link Frame} re-calculate it's bounds.  If the {@link Frame}
   * bounds have changed, it will usually trigger a render cycle in the {@link Viewport}.
   *
   * @return {undefined}
   */
  onDeckResize: function onDeckResize() {
    this.setBounds();
  },

  /**
   * Called on window resize event.  Causes the {@link Frame} to re-calculate its bounds,
   * which might result in a render cycle in the {@link Viewport}.
   *
   * @return {undefined}
   */
  onWindowResize: function onWindowResize() {
    this.setBounds();
  },

  /**
   * Called on window scroll event.  Causes the {@link Frame} to re-calculate its bounds,
   * which might result in a render cycle in the {@link Viewport}.
   *
   * @return {undefined}
   */
  onWindowScroll: function onWindowScroll() {
    this.setBounds();
  }
});

module.exports = Frame;

},{"./events":8,"./ui":24,"./utils":34,"./utils/validate":36,"lodash":"lodash"}],10:[function(require,module,exports){
/**
 * Main index module for all publicly-exposed modules/classes/mixins/etc. in decks.
 *
 * @module decks
 */
module.exports = {
  /**
   * Provides access to the {@link module:decks/events} index module.
   */
  events: require("./events"),

  /**
   * Provides access to the {@link module:decks/layouts} index module.
   */
  layouts: require("./layouts"),

  /**
   * Provides access to the {@link module:decks/ui} index module.
   */
  ui: require("./ui"),

  /**
   * Provides access to the {@link module:decks/utils} index module.
   */
  utils: require("./utils"),

  /**
   * Provides access to the {@link Canvas} class.
   */
  Canvas: require("./canvas"),

  /**
   * Provides access to the {@link Deck} class.
   */
  Deck: require("./deck"),

  /**
   * Provides access to the {@link Frame} class.
   */
  Frame: require("./frame"),

  /**
   * Provides access to the {@link Item} class.
   */
  Item: require("./item"),

  /**
   * Provides access to the {@link ItemCollection} class.
   */
  ItemCollection: require("./itemcollection"),

  /**
   * Provides access to the {@link Layout} class.
   */
  Layout: require("./layout"),

  /**
   * Provides access to the {@link Viewport} class.
   */
  Viewport: require("./viewport"),

  /**
   * Exposes the Hammer module via decks
   */
  Hammer: require("hammerjs"),

  /**
   * Exposes the raf module via decks
   */
  raf: require("raf")
};

},{"./canvas":2,"./deck":3,"./events":8,"./frame":9,"./item":11,"./itemcollection":12,"./layout":13,"./layouts":17,"./ui":24,"./utils":34,"./viewport":37,"hammerjs":"hammerjs","raf":"raf"}],11:[function(require,module,exports){
var _ = require("lodash");
var hasEmitter = require("./events").hasEmitter;
var DecksEvent = require("./events").DecksEvent;
var validate = require("./utils/validate");

/**
 * Manages a data object and adds an event API for setting values
 *
 * @class
 * @mixes hasEmitter
 * @param {Object} [data={}] object containing arbitrary data
 */
function Item(data, options) {
  if (!(this instanceof Item)) {
    return new Item(data);
  }

  data = data || {};
  options = _.merge({}, this.defaultOptions, options);

  this.setEmitter(options.emitter || {});
  this.setId(data);
  this.setIndex(data, { silent: true });
  this.setData(data, { silent: true });
}

_.extend(Item.prototype, hasEmitter, /** @lends Item.prototype */ {
  defaultOptions: {
  },

  /**
   * Destroys the {@Item}
   *
   * @return {undefined}
   */
  destroy: function destroy() {
    // Nothing to do here
  },

  /**
   * Sets the Item's unique ID.
   *
   * This is required for indexing the item in various data structures in decks.js.
   *
   * @param {(String|Number|Object)} data the id string value, id numeric value, or an object which contains an id key
   * @return {undefined}
   */
  setId: function setId(data) {
    if (_.isString(this.id)) {
      throw new Error("Item#setId: Item id cannot be changed");
    }

    if (_.isString(data)) {
      this.id = data;
      return;
    }

    if (_.isNumber(data)) {
      this.id = "" + data; // convert to string
      return;
    }

    // look for possible id properties in the data object
    var key = _.find(["id", "_id", "Id", "ID"], function(key) {
      return _.has(data, key) && (_.isNumber(data[key]) || _.isString(data[key]));
    });

    if (key && (_.isString(data[key]) || _.isNumber(data[key]))) {
      this.id = "" + data[key]; // convert to string
      return;
    }

    // default to generated unique ID
    this.id = "" + _.uniqueId();
  },

  /**
   * Sets the Item's index
   *
   * @param {!(Number|Object)} data numeric index value or an object with a numeric index property
   * @param {?Object} options additional options
   * @return {boolean} whether the index was changed (true: was changed, false: was not changed)
   */
  setIndex: function setIndex(data, options) {
    options = options || {};

    var index = -1;

    if (_.isNumber(data)) {
      index = data;
    } else if (_.has(data, "index") && _.isNumber(data.index)) {
      index = data.index;
    }

    if (this.index === index) {
      return false;
    }

    this.index = index;

    if (!options.silent) {
      this.emit(DecksEvent("item:index:changed", this, this.index));
    }

    return true;
  },

  /**
   * Gets a single property value by key
   *
   * @param {String} key property key
   * @return {*} property value
   */
  get: function get(key) {
    validate(key, "key", { isString: true });

    return this.data[key];
  },

  /**
   * Sets a single property value by key
   *
   * @param {String} key property key
   * @param {*} value property value
   * @param {?Object} options additional options
   * @return {undefined}
   */
  set: function set(key, value, options) {
    validate(key, "key", { isString: true });

    options = options || {};

    if (_.isEqual(this.data[key], value)) {
      return;
    }

    var oldValue = this.get(key);
    this.data[key] = value;

    if (!options.silent) {
      this.emit(DecksEvent("item:changed", this, { key: key, value: value, oldValue: oldValue }));
    }
  },

  /**
   * Gets the full data object
   *
   * @return {Object}
   */
  getData: function getData() {
    return this.data;
  },

  /**
   * Sets the full data object
   *
   * @param {Object} data data object to set
   * @param {?Object} options additional options
   * @return {undefined}
   */
  setData: function setData(data, options) {
    data = data || {};
    options = options || {};
    var oldData = this.getData();

    if (_.isEqual(oldData, data)) {
      return;
    }

    this.data = data;

    if (!options.silent) {
      this.emit(DecksEvent("item:changed", this, { oldData: oldData, data: data }));
    }
  },

  /**
   * Clears the data object (sets to empty object)
   *
   * @param {Object} [options={}] - Additional options
   * @param {boolean} options.silent - If true, do not emit event after clear
   * @return {undefined}
   */
  clear: function clear(options) {
    options = options || {};
    var oldData = this.getData();

    if (_.isEmpty(oldData)) {
      return;
    }

    this.data = {};

    if (!options.silent) {
      this.emit("item:cleared", this);
    }
  }
});

module.exports = Item;

},{"./events":8,"./utils/validate":36,"lodash":"lodash"}],12:[function(require,module,exports){
var _ = require("lodash");
var hasEmitter = require("./events").hasEmitter;
var binder = require("./events").binder;
var DecksEvent = require("./events").DecksEvent;
var Item = require("./item");
var validate = require("./utils/validate");

/**
 * Represents a collection of Items
 *
 * @class
 * @mixes binder
 * @param {(Item[]|Object[])} items items with which to initialize collection
 */
function ItemCollection(items, options) {
  if (!(this instanceof ItemCollection)) {
    return new ItemCollection(items);
  }

  items = items || [];
  options = _.merge({}, this.defaultOptions, options);

  this.setEmitter(options.emitter || {});
  this.items = {};
  this.addItems(items);

  this.emit(DecksEvent("item:collection:ready", this));
}

_.extend(ItemCollection.prototype, binder, hasEmitter, /** @lends ItemCollection.prototype */ {
  /**
   * Default options for ItemCollection instances
   */
  defaultOptions: {
  },

  /**
   * Item events to which to bind for each Item added to the collection.
   *
   * @return {undefined}
   */
  getItemEvents: function() {
    return {
      "*": "onAnyItemEvent"
    };
  },

  /**
   * Binds to all {@link Item} events.
   *
   * It's not necessary to call this directly, unless you called this.unbind at some point.
   *
   * @return {undefined}
   */
  bind: function bind() {
    _.each(this.getItems(), function(item) {
      this.bindEvents(item, this.getItemEvents());
    }, this);
  },

  /**
   * Unbinds from all {@link Item} events.
   *
   * @return {undefined}
   */
  unbind: function bind() {
    _.each(this.getItems(), function(item) {
      this.unbindEvents(item, this.getItemEvents());
    }, this);
  },

  /**
   * Destroys the {@link ItemCollection}
   *
   * @return {undefined}
   */
  destroy: function() {
    this.unbind();

    _.each(this.getItems(), function(item) {
      item.destroy();
    }, this);
  },

  /**
   * Gets a single item from the collection
   *
   * @param {!String} id - Item id to find
   * @return {Item} - Item or null if not found
   */
  getItem: function getItem(id) {
    if (_.isNumber(id)) {
      id = "" + id;
    }

    validate(id, "id", { isString: true });

    return this.items[id];
  },

  /**
   * Gets all {@link Item}s from the collection, or a subset of {@link Item}s based on an optional filter function.
   *
   * @param {?Function} filter - the filter predicate function (takes an item and should return whether Item passes the filter)
   * @return {Item[]} - Array of {@link Item}s (not an {@link ItemCollection} instance)
   */
  getItems: function getItems(filter) {
    var items = _.values(this.items);

    if (filter) {
      items = _.filter(items, filter);
    }

    return items;
  },

  /**
   * Adds an {@link Item} to the {@link ItemCollection}.
   *
   * An event is emitted just before adding the {@link Item} and just after.
   *
   * After adding the {@link Item} the {@link ItemCollection} is re-indexed, based on the current
   * filter function, sortBy function, and reversed flag.
   *
   * @param {!(Item|Object)} item - item instance or options to add
   * @param {?Object} [options={}] - additional options
   * @param {?boolean} [options.silent=false] - if true, the {@link ItemCollection} will not emit events
   * @param {?boolean} [options.noIndex=false] - if true, the {@link ItemCollection} will not be re-indexed after adding the {@link Item}
   * @return {Item} - the {@link Item} instance that was added
   */
  addItem: function addItem(item, options) {
    validate(item, "item", { isRequired: true });

    options = options || {};

    if (!(item instanceof Item)) {
      item = new Item(item);
    }

    if (this.items[item.id]) {
      throw new Error("ItemCollection#addItem: collection already contains an item with id " + item.id);
    }

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:item:adding", this, item));
    }

    this.items[item.id] = item;
    this.bindEvents(item, this.getItemEvents());

    if (!options.noIndex) {
      this.index({ isAddItem: true }, { silent: options.silent });
    }

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:item:added", this, item));
    }

    return item;
  },

  /**
   * Adds an array of items to the collection.
   *
   * Events and indexing will be suppressed for each individual {@link Item} added.
   *
   * @param {!(Item[]|Object[])} items - Array of {@link Item} instances or options objects to add
   * @param {?Object} [options={}] - additional options
   * @param {?boolean} [options.silent=false] - if true, no events will be emitted
   * @param {?boolean} [options.noIndex=false] - if true, the {@link ItemCollection} will not be re-indexed
   * @return {Item[]} - Array of {@link Item} instances that were added.
   */
  addItems: function addItems(items, options) {
    validate(items, "items", { isArray: true });

    options = options || {};

    if (_.isEmpty(items)) {
      return;
    }

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:items:adding", this));
    }

    items = _.map(items, function(item) {
      return this.addItem(item, { silent: true, noIndex: true });
    }, this);

    if (!options.noIndex) {
      this.index({ isAddItems: true }, { silent: options.silent });
    }

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:items:added", this, items));
    }

    return items;
  },

  /**
   * Removes an item from the collection
   *
   * @param {Item} item item to remove
   * @param {?Object} options additional options
   * @return {undefined}
   */
  removeItem: function removeItem(item, options) {
    validate(item, "item", { isInstanceOf: Item });

    options = options || {};

    if (!_.has(this.items, item.id)) {
      return;
    }

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:item:removing", this, item));
    }

    this.unbindEvents(item, this.getItemEvents());
    delete this.items[item.id];

    if (!options.noIndex) {
      this.index({ isRemoveItem: true }, { silent: options.silent });
    }

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:item:removed", this, item));
    }

    return item;
  },

  /**
   * Clears the collection by removing all the {@link Item}s one-by-one.
   *
   * Events and indexing will be suppressed for each individual {@link Item} removed.
   *
   * @param {?Object} options additional options
   * @return {undefined}
   */
  clear: function clear(options) {
    options = options || {};

    if (_.isEmpty(this.items)) {
      return;
    }

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:clearing", this));
    }

    var items = _.map(this.items, function(item) {
      return this.removeItem(item, { silent: true, noIndex: true });
    }, this);

    // There's not really a need to re-index the collection, but some things rely
    // on the indexing events being emitted
    if (!options.noIndex) {
      this.index({ isClear: true }, { silent: options.silent });
    }

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:cleared", this, items));
    }

    return items;
  },

  /**
   * Sets or clears the current filter function.
   *
   * The filter function is used to filter {@link Item}s out of the {@link ItemCollection} based
   * on a predicate.  The {@link Item}s are marked as filtered-out by setting the {@link Item} index
   * to -1 (they are not actually removed from the collection, just flagged in this way).
   *
   * @param {?Function} [filter=null] - the filter function (or null to clear the current filter)
   * @param {?Object} [options={}] - additional options
   * @param {?boolean} [options.silent=false] - if true, events will not be emitted
   * @param {?boolean} [options.noIndex=false] - if true, the collection will not be re-indexed with the new filter
   * @return {undefined}
   */
  setFilter: function setFilter(filter, options) {
    if (!_.isFunction(filter)) {
      filter = null;
    }

    options = options || {};

    if (this.filter === filter) {
      return;
    }

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:filter:setting", this, { oldFilter: this.filter, newFilter: filter }));
    }

    this.filter = filter;

    if (!options.noIndex) {
      this.index({ isSetFilter: true }, { silent: options.silent });
    }

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:filter:set", this, this.filter));
    }
  },

  /**
   * Sets or clears the current sort by function.
   *
   * The sort by function is used to sort the {@link Item}s in the collection.
   * The sortBy function should return a sortable value for each {@link Item}.
   * The sort is applied by updating the {@link Item} index values.
   *
   * @param {?Function} [sortBy=null] - the sort by function (or null to clear the current sort)
   * @param {?Object} [options={}] - additional options
   * @param {?boolean} [options.silent=false] - if true, events will not be emitted
   * @param {?boolean} [options.noIndex=false] - if true, the collection will not be re-indexed with the new sort
   * @return {undefined}
   */
  setSortBy: function setSortBy(sortBy, options) {
    if (!_.isFunction(sortBy)) {
      sortBy = null;
    }

    options = options || {};

    if (this.sortBy === sortBy) {
      return;
    }

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:sort:by:setting", this, { oldSortBy: this.sortBy, newSortBy: sortBy }));
    }

    this.sortBy = sortBy;

    if (!options.noIndex) {
      this.index({ isSetSortBy: true }, { silent: options.silent });
    }

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:sort:by:set", this, this.sortBy));
    }
  },

  /**
   * Reverses the sort on the collection.
   *
   * The reversing is applied by re-indexing all the {@link Item}s in the {@link ItemCollection}.
   *
   * @param {?boolean} [isReversed=false] - whether the collection should be reversed.
   * @param {?Object} [options={}] - additional options
   * @param {?boolean} [options.silent=false] - if true, events will not be emitted
   * @param {?boolean} [options.noIndex=false] - if true, the collection will not be re-indexed with the new reverse value.
   * @return {undefined}
   */
  setReversed: function setReversed(isReversed, options) {
    isReversed = !!isReversed;
    options = options || {};

    if (this.isReversed === isReversed) {
      return;
    }

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:reversed:setting", this, { oldIsReversed: this.isReversed, newIsReversed: isReversed }));
    }

    this.isReversed = isReversed;

    if (!options.noIndex) {
      this.index({ isSetReversed: true }, { silent: options.silent });
    }

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:reversed:set", this, this.isReversed));
    }
  },

  /**
   * Indexes the {@link ItemCollection} based on the current filter function, sortBy function, and
   * reversed flag.  Each {@link Item} in the collection will have it's index value set based on
   * the filter/sortBy/reversed representation of the {@link ItemCollection} items.
   *
   * The sorting and filtering is applied to the {@link Item}s by updating the {@link Item} index values.
   * {@link Item}s are not physically moved or removed from the {@link ItemCollection}.
   *
   * If {@link Item}s are filtered out via the filter function, the {@link Item} index will be set to
   * -1.  The {@link Layout#getRenders} method can check if item.index is -1 to decide if the {@link Item}
   *  should be displayed.
   *
   * @param {!Object} reason - an object which indicates why the collection is being indexed
   * @param {?Object} options - additional options
   * @param {?boolean} [options.silent=false] - if true, no events will be emitted
   * @return {undefined}
   */
  index: function index(reason, options) {
    validate(reason, "reason", { isRequired: true });
    options = options || {};

    // Create a list of filtered, sorted, and reversed items, then find the index of each item
    // in the reference list.  If the item is not in the ref list, it will get an index of -1,
    // which means it should not be drawn (or should be hidden).
    var referenceItems = _(this.getItems());

    if (this.filter) {
      referenceItems = referenceItems.filter(this.filter);
    }

    if (this.sortBy) {
      referenceItems = referenceItems.sortBy(this.sortBy);
    }

    if (this.isReversed) {
      referenceItems = referenceItems.reverse();
    }

    referenceItems = referenceItems.value();

    var items = this.getItems();

    var totalCount = items.length;
    var referenceCount = referenceItems.length;

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:indexing", this, {
        reason: reason,
        totalCount: totalCount,
        referenceCount: referenceCount
      }));
    }

    var changedCount = _.reduce(items, function indexItem(count, item) {
      var index = _.indexOf(referenceItems, item);
      if (item.setIndex(index, { silent: options.silent })) {
        count++;
      }
      return count;
    }, 0);

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:indexed", this, {
        reason: reason,
        totalCount: totalCount,
        referenceCount: referenceCount,
        changedCount: changedCount
      }));
    }
  },

  /**
   * Called for {@link Item} events.  Forwards the {@link Item} events via the {@ItemCollection}
   * emitter.
   *
   * @param e
   * @return {undefined}
   */
  onAnyItemEvent: function onAnyItemEvent(e) {
    this.emit(e);
  }
});

module.exports = ItemCollection;

},{"./events":8,"./item":11,"./utils/validate":36,"lodash":"lodash"}],13:[function(require,module,exports){
var _ = require("lodash");
var binder = require("./events/binder");

/**
 * Contains the logic for rendering a layout of items
 *
 * Can be subclassed to implement layout methods, or can be passed
 * layout methods in the Layout constructor options.
 *
 * @class
 * @mixes binder
 * @param {?Object} options - layout options
 * @param {?Function} options.getRenders - implementation of getRenders method
 * @param {?Function} options.initializeRender - implementation of initializeRender method
 * @param {?Function} options.loadRender - implementation of loadRender method
 * @param {?Function} options.unloadRender - implementation of unloadRender method
 * @param {?Function} options.getShowAnimation - implementation of getShowAnimation method
 * @param {?Function} options.getHideAnimation - implementation of getHideAnimation method
 * @param {?Function} options.setShowAnimation - implementation of setShowAnimation method
 * @param {?Function} options.setHideAnimation - implementation of setHideAnimation method
 * @returns {Layout}
 */
function Layout(options) {
  if (!(this instanceof Layout)) {
    return new Layout(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  // Allow the caller to create a Layout implementation without subclassing Layout -
  // just by passing in implementations of the key methods in options
  _.each(this.getOverridables(), function(key) {
    if (options[key]) {
      this[key] = options[key];
    }
  }, this);
}

_.extend(Layout.prototype, binder, /** @lends Layout.prototype */ {
  /**
   * Default options for a Layout instance
   */
  defaultOptions: {
  },

  /**
   * List of method names that can be overridden by passing them in via
   * options properties in the constructor.  You can also override these
   * properties by subclassing {@link Layout}.
   */
  getOverridables: function() {
    return [
      // Render-related methods
      "getRenders",
      "initializeRender",
      "shouldLoadRender",
      "loadRender",
      "unloadRender",

      // Animation-related methods
      "getShowAnimation",
      "getHideAnimation",
      "setShowAnimation",
      "setHideAnimation",

      // Canvas/Gesture-related methods
      "getCanvasGestureOptions",
      "getMoveToElementOffsets",

      // Custom render-related methods
      "getCustomRenders",

      // Emitter event handlers
      "onViewportItemDrawing",
      "onViewportItemsDrawing",
      "onViewportRenderDrawing",
      "onViewportRenderErasing",
      "onViewportRenderDrawn",
      "onViewportRenderErased",
      "onViewportAllRendersDrawn",
      "onCanvasBoundsSet",
      "onFrameBoundsSet",
      "onItemCollectionFilterSet",
      "onItemCollectionSortBySet",
      "onItemCollectionReversedSet",
      "onItemCollectionIndexed"
    ];
  },

  /**
   * Events that all Layout instances will bind to, so the layout can receive
   * notifications when certain decks events occur.
   */
  getEmitterEvents: function() {
    return {
      "viewport:item:drawing": "onViewportItemDrawing",
      "viewport:items:drawing": "onViewportItemsDrawing",
      "viewport:render:drawing": "onViewportRenderDrawing",
      "viewport:render:erasing": "onViewportRenderErasing",
      "viewport:render:drawn": "onViewportRenderDrawn",
      "viewport:render:erased": "onViewportRenderErased",
      "viewport:all:renders:drawn": "onViewportAllRendersDrawn",
      "canvas:bounds:set": "onCanvasBoundsSet",
      "frame:bounds:set": "onFrameBoundsSet",
      "item:collection:filter:set": "onItemCollectionFilterSet",
      "item:collection:sort:by:set": "onItemCollectionSortBySet",
      "item:collection:reversed:set": "onItemCollectionReversedSet",
      "item:collection:indexed": "onItemCollectionIndexed"
    };
  },

  /**
   * Destroys the layout (no-op by default)
   *
   * @return {undefined}
   */
  destroy: _.noop,

  /**
   * Creates the "render" or "renders" for a given {@link Item} during a (re-)drawing cycle.
   *
   * A "render" is basically an instruction to the {@link Viewport} on where and how to draw
   * the item in the * {@link Canvas}.  An {@link Item} can be drawn in the {@link Canvas} one
   * time, or multiple times, which is specified by how many render objects this method returns.
   *
   * The {@link Viewport} invokes this method for an/each {@link Item} when a drawing
   * cycle is happening.  This method should return a "render" object (which is a set of
   * DOM style properties to apply to the render's element, along with animation options,
   * like duration, easing, delay, etc.), or an array of render objects.
   *
   * The Viewport will reconcile any existing renders/elements for the given {@link Item}, and
   * eventually animate an element to the property values listed in "transform", with the
   * animation controlled by the options in "animateOptions".
   *
   * This method is abstract at this level - it must be implemented by either passing
   * an options.getRenders function value into the {@link Layout} constructor, or
   * creating a subclass of {@link Layout} that implements this method on itself, or its
   * prototype.
   *
   * A render object must have "transform" and "animateOptions" properties at a minimum,
   * but can also have any other arbitrary properties that are needed for loading or unloading
   * the render at a later time (e.g. in load/unloadRender).
   *
   * A render might look like this:
   *
   * @abstract
   * @param {!Item} item - Item for which to create renders
   * @param {!Object} options - Other options provided by the {@link Viewport}
   * @returns {(Object|Object[])} - The render object or array of render objects for the {@link Item}
   * @example Example render object created by Layout#getRenders:
   * {
   *   transform: {
   *    top: 20,
   *    left: 20,
   *    width: 200,
   *    height: 150,
   *    rotateZ: 20
   *   },
   *   animateOptions: {
   *    duration: 200,
   *    easing: "easeInOutExpo"
   *   },
   *   someLayoutSpecificProperty: "some value",
   * }
   */
  getRenders: function getRenders(/*item, options*/) {
    throw new Error("Layout#getRenders: not implemented");
  },

  /**
   * Allows the layout to initialize a new render element, when a new render element is needed
   * for a render.
   *
   * @param {Object} render - The render object that was just created
   * @returns {undefined}
   */
  initializeRender: function initializeRender(render, options) {
    // Call unloadRender for this by default, as these methods are probably similar
    this.unloadRender(render, options);
  },

  /**
   * Returns whether the given render should be loaded at the time of invocation.
   * The {@link Layout} can implement this method if there are cases where a render
   * might not be normally loaded, but should be.
   *
   * @param render
   * @return {undefined}
   */
  shouldLoadRender: function shouldLoadRender(/*render, options*/) {
    return false;
  },

  /**
   * Contains the logic to load the contents of a render (e.g. load an image in the render element)
   *
   * @param {Object} render - The render object to load
   * @returns {undefined}
   */
  loadRender: function loadRender(/*render, options*/) {
    throw new Error("Layout#loadRender not implemented");
  },

  /**
   * Contains the logic to unload the contents of a render (e.g. remove the DOM content of a render element)
   *
   * @param {Object} render - The render object to unload
   * @param {Object} options
   * @returns {undefined}
   */
  unloadRender: function unloadRender(/*render, options*/) {
    throw new Error("Layout#unloadRender not implemented");
  },

  /**
   * Event handler which informs the {@link Layout} that a render cycle is about to start for a
   * single {@link Item}.
   *
   * @param {DecksEvent} e - event object
   * @param {string} e.type - the event type
   * @param {Viewport} e.sender - the sender of the event (Viewport instance)
   * @param {Item} e.data - the {@link Item} that is about to be drawn (animated)
   * @return {undefined}
   */
  onViewportItemDrawing: _.noop,

  /**
   * Event handler which informs the {@link Layout} that a render cycle is about to start for a
   * multiple {@link Item}s.
   *
   * @param {DecksEvent} e - event object
   * @param {string} e.type - the event type
   * @param {Viewport} e.sender - the sender of the event (Viewport instance)
   * @param {Item[]} e.data - the {@link Item}s that are about to be drawn (animated)
   * @return {undefined}
   */
  onViewportItemsDrawing: _.noop,

  /**
   * Event handler which informs the {@link Layout} that a render is about to start drawing (animating).
   * The {@link Layout} can use this method to modify the render/element before the animation starts.
   *
   * @param {DecksEvent} e - event object
   * @param {string} e.type - the event type
   * @param {Viewport} e.sender - the sender of the event (Viewport instance)
   * @param {Object} e.data - the "render" object that is about to be drawn (animated)
   * @return {undefined}
   */
  onViewportRenderDrawing: _.noop,

  /**
   * Event handler which informs the {@link Layout} that a render is about to start erasing (animating
   * to a hidden state before being removed).)
   * The {@link Layout} can use this method to modify the render/element before the animation starts.
   *
   * @param {DecksEvent} e - event object
   * @param {string} e.type - the event type
   * @param {Viewport} e.sender - the sender of the event (Viewport instance)
   * @param {Object} e.data - the "render" object that is about to be drawn (animated)
   * @return {undefined}
   */
  onViewportRenderErasing: _.noop,

  /**
   * Event handler which informs the {@link Layout} when a single render has finished animating.
   *
   * @param {DecksEvent} e - event object
   * @return {undefined}
   */
  onViewportRenderDrawn: _.noop,

  /**
   * Event handler which informs the {@link Layout} when a single render has finished its hide animation.
   *
   * @param {DecksEvent} e - event object
   * @return {undefined}
   */
  onViewportRenderErased: _.noop,

  /**
   * Event handler which informs the {@link Layout} when a all renders in one drawing cycle have finished animating.
   *
   * @param {DecksEvent} e - event object
   * @return {undefined}
   */
  onViewportAllRendersDrawn: _.noop,

  /**
   * Event handler which informs the {@link Layout} when the {@link Canvas} bounds have been set.
   *
   * @param {DecksEvent} e - event object
   * @return {undefined}
   */
  onCanvasBoundsSet: _.noop,

  /**
   * Event handler which informs the {@link Layout} when the {@link Frame} bounds have been set.
   *
   * @param {DecksEvent} e - event object
   * @return {undefined}
   */
  onFrameBoundsSet: _.noop,

  /**
   * Event handler which informs the {@link Layout} when the {@link ItemCollection} filter has been set.
   *
   * @param {DecksEvent} e - event object
   * @return {undefined}
   */
  onItemCollectionFilterSet: _.noop,

  /**
   * Event handler which informs the {@link Layout} when the {@link ItemCollection} sort by function has been set.
   *
   * @param {DecksEvent} e - event object
   * @return {undefined}
   */
  onItemCollectionSortBySet: _.noop,

  /**
   * Event handler which informs the {@link Layout} when the {@link ItemCollection} reversed flag has been set.
   *
   * @param {DecksEvent} e - event object
   * @return {undefined}
   */
  onItemCollectionReversedSet: _.noop,

  /**
   * Event handler which informs the {@link Layout} when the {@link ItemCollection} has been (re-)indexed..
   *
   * @param {DecksEvent} e - event object
   * @return {undefined}
   */
  onItemCollectionIndexed: _.noop,

  /**
   * Gets the animation to use/merge when showing a render.
   * This would typically be transform properties that ensure the element
   * is fully visible (e.g. opacity: 1, scaleX: 1, scaleY: 1, display: auto, etc.)
   *
   * Override this method in a {@link Layout} subclass or with {@link Layout} options
   * to provide a custom "show" animation.
   */
  getShowAnimation: function getShowAnimation() {
    return {
      transform: {
        //opacity: 1,
        scaleX: 1,
        scaleY: 1,
        rotateZ: 0
      },
      animateOptions: {
        duration: 400,
        display: "auto"
      }
    };
  },

  /**
   * Gets the base animation to use/merge when hiding (removing) a render
   * This is typically the opposite of the show animation transform.  E.g.
   * if the show animation sets opacity: 1, this might set opacity: 0.
   *
   * Override this method in a {@link Layout} subclass or with {@link Layout} options
   * to provide a custom "hide" animation.
   */
  getHideAnimation: function getHideAnimation() {
    return {
      transform: {
        //opacity: 0,
        scaleX: 0,
        scaleY: 0,
        rotateZ: 0
      },
      animateOptions: {
        duration: 400,
        display: "none"
      }
    };
  },

  /**
   * Sets the animation on a render to include the default show animation.
   *
   * @param {!Object} render - render on which to add the show animation
   * @returns {undefined}
   */
  setShowAnimation: function setShowAnimation(render) {
    _.merge(render, this.getShowAnimation());
  },

  /**
   * Sets an animation on a render to remove the render.  The implementation of this method should set
   * transform and animateOptions properties on the render.
   *
   * @param {!Object} render render on which to set animation
   * @return {undefined}
   */
  setHideAnimation: function setHideAnimation(render) {
    _.merge(render, this.getHideAnimation());
  },

  /**
   * Returns an array of render objects, or a single render object, which are not associated
   * with items.  This can be used to draw custom elements on the {@link Canvas}, like divider lines,
   * non-item-associated labels, etc.
   *
   * @param {Object} options - standard layout method options (viewport, frame, etc.)
   * @return {Object[]} - array of custom render objects
   */
  getCustomRenders: function getCustomRenders(/*options*/) {
    return {};
  },

  /**
   * Gets the default gesture handler options to apply to render elements
   *
   * @param {!Object} render - render object
   * @param {!Object} options - standard {@link Layout} method options
   * @return {Object} - {@link GestureHandler} options to apply to the render
   */
  getRenderGestureOptions: function getRenderGestureOptions() {
    return {
      gestures: {
        pan: {
          enabled: false,
          horizontal: true,
          vertical: false
        },
        swipe: {
          enabled: false,
          horizontal: true,
          vertical: false
        }
      },
      snapping: {
        toBounds: true,
        toNearestChildElement: false
      }
    };
  },

  /**
   * Gets the gesture handler options to use for the {@link Canvas} for this {@link Layout}.
   *
   * Each {@link Layout} might call for different {@link Canvas} gestures, like a vertical list Layout
   * might only allow vertical panning/swiping, whereas a horizontal list might only allow horizontal
   * scrolling.
   *
   * Override this method in a {@link Layout} subclass or {@link Layout} options.
   */
  getCanvasGestureOptions: function getCanvasGestureOptions() {
    return {};
  },

  /**
   * Gets the {@link Layout}s preferences for how the canvas is resized when elements are added
   * or removed.
   *
   * @return {Object} - the resize options
   */
  getCanvasBoundsOptions: function getCanvasBoundsOptions() {
    return {
      marginRight: 0,
      marginBottom: 0,
      paddingRight: 0,
      paddingBottom: 0,
      preventOverflowHorizontal: false,
      preventOverflowVertical: false,
      preventScrollbarHorizontal: false,
      preventScrollbarVertical: false,
      scrollbarSize: 20
    };
  },

  /**
   * Gets extra offsets to apply when panning to an item
   *
   * @param {!Element} element - element being moved to
   * @return {undefined}
   */
  getMoveToElementOffsets: function getMoveToElementOffsets(/*element*/) {
    return {
      x: 0,
      y: 0
    };
  }
});

module.exports = Layout;

},{"./events/binder":4,"lodash":"lodash"}],14:[function(require,module,exports){
var _ = require("lodash");
var dom = require("../ui/dom");
var Layout = require("../layout");

/**
 * Basic grid layout implementation
 *
 * @class
 * @extends Layout
 * @param {?Object} options - additional options
 */
function BasicGridLayout(options) {
  if (!(this instanceof BasicGridLayout)) {
    return new BasicGridLayout(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  this.itemWidth = options.itemWidth;
  this.itemHeight = options.itemHeight;
  this.scrollbarWidth = options.scrollbarWidth;
  this.transform = options.transform;
  this.animateOptions = options.animateOptions;

  Layout.call(this, options);
}

BasicGridLayout.prototype = _.create(Layout.prototype, /** @lends BasicGridLayout.prototype */ {
  constructor: BasicGridLayout,

  defaultOptions: _.merge({}, Layout.prototype.defaultOptions, {
    itemWidth: 300,
    itemHeight: 200,
    scrollbarWidth: 20,
    transform: {},
    animateOptions: {}
  }),

  getItemsPerRow: function(width) {
    return Math.floor(width / this.itemWidth) - 2;
  },

  getItemPadding: function(itemsPerRow, width) {
    return (width - (itemsPerRow * this.itemWidth)) / (itemsPerRow + 1);
  },

  getTop: function(index, itemsPerRow, itemPadding) {
    var row = Math.floor(index / itemsPerRow);
    return row * (this.itemHeight + itemPadding) + itemPadding;
  },

  getLeft: function(index, itemsPerRow, itemPadding) {
    var column = index % itemsPerRow;
    return column * (this.itemWidth + itemPadding) + itemPadding;
  },

  getTransform: function(item, options) {
    var index = item.index;
    var width = options.frame.bounds.width;
    var itemsPerRow = this.getItemsPerRow(width);
    this.itemPadding = this.getItemPadding(itemsPerRow, width);

    return _.merge({}, this.transform, {
      top: this.getTop(index, itemsPerRow, this.itemPadding),
      left: this.getLeft(index, itemsPerRow, this.itemPadding),
      width: this.itemWidth,
      height: this.itemHeight
    });
  },

  getAnimateOptions: function(/* item */) {
    return _.merge({
      duration: 600
    }, this.animateOptions);
  },

  getRenders: function(item, options) {
    if (item.index === -1) {
      return this.getHideAnimation();
    }

    return _.merge(this.getShowAnimation(), {
      transform: this.getTransform(item, options),
      animateOptions: this.getAnimateOptions(item)
    });
  },

  getMoveToElementOffsets: function(/*element*/) {
    return {
      x: -this.itemPadding,
      y: -this.itemPadding
    };
  },

  getCustomRenders: function(options) {
    var itemCount = options.itemCollection.getItems(function(item) {
      return item.index !== -1;
    }).length;
    var itemsPerRow = this.getItemsPerRow(options.frame.bounds.width);
    var rowCount = Math.ceil(itemCount / itemsPerRow);
    var itemPadding = this.getItemPadding(itemsPerRow, options.frame.bounds.width);

    var element = options.viewport.createCustomRenderElement();
    dom.text(element, "BasicGridLayout");

    var renders = [
      {
        element: element,
        transform: {
          top: 3,
          left: 3,
          zIndex: this.baseZIndex + 100
        },
        animateOptions: {
          duration: 400
        }
      }
    ];

    _.each(_.range(rowCount), function(rowIndex) {
      var element = options.viewport.createCustomRenderElement();
      var hr = dom.create("hr");
      hr.style.margin = 0;
      dom.append(element, hr);
      var top = (this.itemHeight + itemPadding) * (rowIndex + 1) + 0.5 * itemPadding;

      renders.push({
        element: element,
        transform: {
          top: [top, top],
          width: "100%",
          margin: 0
        },
        animateOptions: {
          duration: 400
        }
      });
    }, this);

    return renders;
  },

  getCanvasGestureOptions: function() {
    return {
      gestures: {
        tap: {
          enabled: true
        },
        press: {
          enabled: true
        }
      }
    };
  },

  getCanvasBoundsOptions: function(){
    var options = Layout.prototype.getCanvasBoundsOptions();
    options.marginBottom = 40;
    options.preventOverflowHorizontal = true;
    options.preventScrollbarHorizontal = true;
    return options;
  }
});

module.exports = BasicGridLayout;

},{"../layout":13,"../ui/dom":20,"lodash":"lodash"}],15:[function(require,module,exports){
var _ = require("lodash");
var dom = require("../ui/dom");
var Layout = require("../layout");
var BasicGridLayout = require("./basicgridlayout");

function randomPlusMinus(range) {
  return Math.random() * range - (range / 2);
}

/**
 * Basic stack layout implementation
 *
 * @class
 * @extends BasicGridLayout
 * @param {Object} [options={}] - Additional options
 */
function BasicStackLayout(options) {
  if (!(this instanceof BasicStackLayout)) {
    return new BasicStackLayout(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  this.stacks = [];

  _.each(this.overridables, function(key) {
    if (options[key]) {
      this[key] = options[key];
    }
  }, this);

  BasicGridLayout.call(this, options);
}

BasicStackLayout.prototype = _.create(BasicGridLayout.prototype, /** @lends BasicStackLayout.prototype */ {
  constructor: BasicStackLayout,

  defaultOptions: _.merge({}, BasicGridLayout.prototype.defaultOptions, {
  }),

  getOverridables: function() {
    var overridables = Layout.prototype.getOverridables();
    overridables.push("getStackNames");
    return overridables;
  },

  getStackNames: function(item) {
    var groups = item.get("groups");

    _.each(groups, function(group) {
      if (!_.contains(this.stacks, group)) {
        this.stacks.push(group);
      }
    }, this);

    return groups;
  },

  getStackTop: function(stackName, itemsPerRow, itemPadding) {
    var index = _.indexOf(this.stacks, stackName);
    return this.getTop(index, itemsPerRow, itemPadding);
  },

  getStackLeft: function(stackName, itemsPerRow, itemPadding) {
    var index = _.indexOf(this.stacks, stackName);
    return this.getLeft(index, itemsPerRow, itemPadding);
  },

  getRenders: function(item, options) {
    var stackNames = this.getStackNames(item);
    var width = options.frame.bounds.width;
    var itemsPerRow = this.getItemsPerRow(width);
    this.itemPadding = this.getItemPadding(itemsPerRow, width);

    return _.map(stackNames, function(stackName) {
      return {
        transform: {
          top: this.getStackTop(stackName, itemsPerRow, this.itemPadding) + randomPlusMinus(5),
          left: this.getStackLeft(stackName, itemsPerRow, this.itemPadding) + randomPlusMinus(5),
          rotateZ: 360 - randomPlusMinus(30),
          width: this.itemWidth,
          height: this.itemHeight
        },
        animateOptions: {
          duration: 600
        }
      };
    }, this);
  },

  getCustomRenders: function(options) {
    var element = options.viewport.createCustomRenderElement();
    dom.text(element, "BasicStackLayout");

    return {
      element: element,
      transform: {
        top: 3,
        left: 3,
        zIndex: this.baseZIndex + 100
      },
      animateOptions: {
        duration: 400
      }
    };
  }
});

module.exports = BasicStackLayout;

},{"../layout":13,"../ui/dom":20,"./basicgridlayout":14,"lodash":"lodash"}],16:[function(require,module,exports){
var _ = require("lodash");
var dom = require("../ui/dom");
var Layout = require("../layout");

/**
 * Basic row layout implementation
 *
 * @class
 * @extends Layout
 * @param {?Object} options - additional options
 */
function ColumnLayout(options) {
  if (!(this instanceof ColumnLayout)) {
    return new ColumnLayout(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  this.itemWidth = options.itemWidth;
  this.itemHeight = options.itemHeight;
  this.itemsPerColumn = options.itemsPerColumn;
  this.itemPadding = options.itemPadding;
  this.scrollbarWidth = options.scrollbarWidth;
  this.transform = options.transform;
  this.animateOptions = options.animateOptions;

  Layout.call(this, options);
}

ColumnLayout.prototype = _.create(Layout.prototype, /** @lends ColumnLayout.prototype */ {
  constructor: ColumnLayout,

  defaultOptions: _.merge({}, Layout.prototype.defaultOptions, {
    itemWidth: 300,
    itemHeight: 200,
    itemsPerColumn: 20,
    itemPadding: 40,
    scrollbarWidth: 20,
    transform: {},
    animateOptions: {}
  }),

  getItemsPerColumn: function() {
    return this.itemsPerColumn;
  },

  getItemPadding: function() {
    return this.itemPadding;
  },

  getTop: function(index, itemsPerColumn, itemPadding) {
    var row = index % itemsPerColumn;
    return row * (this.itemHeight + itemPadding) + itemPadding;
  },

  getLeft: function(index, itemsPerColumn, itemPadding) {
    var column = Math.floor(index / itemsPerColumn);
    return column * (this.itemWidth + itemPadding) + itemPadding;
  },

  getTransform: function(item/*, options*/) {
    var index = item.index;
    var itemsPerColumn = this.getItemsPerColumn();
    var itemPadding = this.getItemPadding();

    return _.merge({}, this.transform, {
      top: this.getTop(index, itemsPerColumn, itemPadding),
      left: this.getLeft(index, itemsPerColumn, itemPadding),
      width: this.itemWidth,
      height: this.itemHeight
    });
  },

  getAnimateOptions: function(/* item */) {
    return _.merge({
      duration: 600
    }, this.animateOptions);
  },

  getRenders: function(item, options) {
    if (item.index === -1) {
      return this.getHideAnimation();
    }

    var gestureGroup = "" + Math.floor(item.index / this.getItemsPerColumn());

    return _.merge(this.getShowAnimation(), {
      transform: this.getTransform(item, options),
      animateOptions: this.getAnimateOptions(item),
      gestureHandlerGroupId: gestureGroup
    });
  },

  getMoveToElementOffsets: function(/*element*/) {
    return {
      x: -this.itemPadding,
      y: -this.itemPadding
    };
  },

  getCustomRenders: function(options) {
    var labelElement = options.viewport.createCustomRenderElement();
    dom.text(labelElement, "ColumnLayout");

    return {
      element: labelElement,
      transform: {
        top: 3,
        left: 3,
        zIndex: this.baseZIndex + 100
      },
      animateOptions: {
        duration: 400
      }
    };
  },

  getRenderGestureOptions: function() {
    return {
      gestures: {
        pan: {
          enabled: true,
          horizontal: false,
          vertical: true
        },
        swipe: {
          enabled: true,
          horizontal: false,
          vertical: true
        }
      }
    };
  },

  getCanvasGestureOptions: function() {
    return {
      gestures: {
        tap: {
          enabled: true
        },
        press: {
          enabled: true
        },
        pan: {
          vertical: false,
          horizontal: true
        },
        swipe: {
          vertical: false,
          horizontal: true
        }
      },
      snapping: {
        toBounds: false,
        toNearestChildElement: false
      }
    };
  },

  getCanvasBoundsOptions: function() {
    var options = Layout.prototype.getCanvasBoundsOptions();
    options.preventOverflowVertical = true;
    options.preventScrollbarVertical = true;
    return options;
  }
});

module.exports = ColumnLayout;

},{"../layout":13,"../ui/dom":20,"lodash":"lodash"}],17:[function(require,module,exports){
/**
 * Index module for all of the pre-built/sample Layout implementations in decks.
 *
 * @module decks/layouts
 */
module.exports = {
  /**
   * Provides access to the {@link BasicGridLayout} class.
   */
  BasicGridLayout: require("./basicgridlayout"),

  /**
   * Provides access to the {@link BasicStackLayout} class.
   */
  BasicStackLayout: require("./basicstacklayout"),

  /**
   * Provides access to the {@link RowLayout} class.
   */
  RowLayout: require("./rowlayout"),

  /**
   * Provides access to the {@link ColumnLayout} class.
   */
  ColumnLayout: require("./columnlayout"),

  /**
   * Provides access to the {@link ZoomLayout} class.
   */
  ZoomLayout: require("./zoomlayout")
};

},{"./basicgridlayout":14,"./basicstacklayout":15,"./columnlayout":16,"./rowlayout":18,"./zoomlayout":19}],18:[function(require,module,exports){
var _ = require("lodash");
var dom = require("../ui/dom");
var Layout = require("../layout");

/**
 * Basic row layout implementation
 *
 * @class
 * @extends Layout
 * @param {?Object} options - additional options
 */
function RowLayout(options) {
  if (!(this instanceof RowLayout)) {
    return new RowLayout(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  this.itemWidth = options.itemWidth;
  this.itemHeight = options.itemHeight;
  this.itemsPerRow = options.itemsPerRow;
  this.itemPadding = options.itemPadding;
  this.scrollbarWidth = options.scrollbarWidth;
  this.transform = options.transform;
  this.animateOptions = options.animateOptions;

  Layout.call(this, options);
}

RowLayout.prototype = _.create(Layout.prototype, /** @lends RowLayout.prototype */ {
  constructor: RowLayout,

  defaultOptions: _.merge({}, Layout.prototype.defaultOptions, {
    itemWidth: 300,
    itemHeight: 200,
    itemsPerRow: 20,
    itemPadding: 40,
    scrollbarWidth: 20,
    transform: {},
    animateOptions: {}
  }),

  getItemsPerRow: function() {
    return this.itemsPerRow;
  },

  getItemPadding: function() {
    return this.itemPadding;
  },

  getTop: function(index, itemsPerRow, itemPadding) {
    var row = Math.floor(index / itemsPerRow);
    return row * (this.itemHeight + itemPadding) + itemPadding;
  },

  getLeft: function(index, itemsPerRow, itemPadding) {
    var column = index % itemsPerRow;
    return column * (this.itemWidth + itemPadding) + itemPadding;
  },

  getTransform: function(item/*, options*/) {
    var index = item.index;
    var itemsPerRow = this.getItemsPerRow();
    var itemPadding = this.getItemPadding();

    return _.merge({}, this.transform, {
      top: this.getTop(index, itemsPerRow, itemPadding),
      left: this.getLeft(index, itemsPerRow, itemPadding),
      width: this.itemWidth,
      height: this.itemHeight
    });
  },

  getAnimateOptions: function(/* item */) {
    return _.merge({
      duration: 600
    }, this.animateOptions);
  },

  getRenders: function(item, options) {
    if (item.index === -1) {
      return this.getHideAnimation();
    }

    var gestureGroup = "" + Math.floor(item.index / this.getItemsPerRow());

    return _.merge(this.getShowAnimation(), {
      transform: this.getTransform(item, options),
      animateOptions: this.getAnimateOptions(item),
      gestureHandlerGroupId: gestureGroup
    });
  },

  getMoveToElementOffsets: function(/*element*/) {
    return {
      x: -this.itemPadding,
      y: -this.itemPadding
    };
  },

  getCustomRenders: function(options) {
    var itemCount = options.itemCollection.getItems(function(item) {
      return item.index !== -1;
    }).length;

    var itemsPerRow = this.getItemsPerRow();
    var rowCount = Math.ceil(itemCount / itemsPerRow);
    var itemPadding = this.getItemPadding();

    var labelElement = options.viewport.createCustomRenderElement();
    dom.text(labelElement, "RowLayout");

    var renders = [
      {
        element: labelElement,
        transform: {
          top: 3,
          left: 3,
          zIndex: this.baseZIndex + 100
        },
        animateOptions: {
          duration: 400
        }
      }
    ];

    _.each(_.range(rowCount), function(rowIndex) {
      var dividerElement = options.viewport.createCustomRenderElement();
      var hr = dom.create("hr");
      hr.style.margin = 0;
      dom.append(dividerElement, hr);
      var top = (this.itemHeight + itemPadding) * (rowIndex + 1) + 0.5 * itemPadding;

      renders.push({
        element: dividerElement,
        transform: {
          top: [top, top],
          width: "100%",
          margin: 0
        },
        animateOptions: {
          duration: 600
        }
      });
    }, this);

    return renders;
  },

  getRenderGestureOptions: function() {
    return {
      gestures: {
        pan: {
          enabled: true,
          horizontal: true,
          vertical: false
        },
        swipe: {
          enabled: true,
          horizontal: true,
          vertical: false
        }
      }
    };
  },

  getCanvasGestureOptions: function() {
    return {
      gestures: {
        tap: {
          enabled: true
        },
        press: {
          enabled: true
        },
        pan: {
          vertical: true,
          horizontal: false
        },
        swipe: {
          vertical: true,
          horizontal: false
        }
      },
      snapping: {
        toBounds: false,
        toNearestChildElement: false
      }
    };
  },

  getCanvasBoundsOptions: function() {
    var options = Layout.prototype.getCanvasBoundsOptions();
    options.preventOverflowHorizontal = true;
    options.preventScrollbarHorizontal = true;
    return options;
  }
});

module.exports = RowLayout;

},{"../layout":13,"../ui/dom":20,"lodash":"lodash"}],19:[function(require,module,exports){
var _ = require("lodash");
var Layout = require("../layout");


/**
 * Basic zoomed-in layout implementation
 *
 * @class
 * @extends Layout
 * @param {?Object} options - options
 */
function ZoomLayout(options) {
  if (!(this instanceof ZoomLayout)) {
    return new ZoomLayout(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  this.horizontal = options.horizontal;
  this.vertical = options.vertical;
  if (this.horizontal && this.vertical) {
    throw new Error("ZoomLayout#constructor: cannot be both horizontal and vertical");
  }
  if (!this.horizontal && !this.vertical) {
    this.horizontal = true; // default to horizontal
  }
  this.padding = options.padding || 10;

  Layout.call(this, options);
}

ZoomLayout.prototype = _.create(Layout.prototype, /** @lends ZoomLayout.prototype */ {
  constructor: ZoomLayout,

  defaultOptions: _.merge({}, Layout.prototype.defaultOptions, {
    horizontal: true,
    vertical: false
  }),

  getRenders: function(item, options) {
    var width = options.frame.bounds.width - (2 * this.padding) - 20;
    var height = options.frame.bounds.height - (2 * this.padding) - 20;

    return {
      transform: this.getTransform(item, width, height),
      animateOptions: this.getAnimateOptions()
    };
  },

  getTransform: function(item, width, height) {
    var transform = {
      width: width,
      height: height,
      rotateZ: 0
    };

    if (this.horizontal) {
      transform.top = this.padding;
      transform.left = item.index * (this.padding + width) + this.padding;
    } else if (this.vertical) {
      transform.top = item.index * (this.padding + height) + this.padding;
      transform.left = this.padding;
    }

    return transform;
  },

  getAnimateOptions: function() {
    return {
      duration: 600
    };
  },

  getCanvasGestureOptions: function() {
    return {
      gestures: {
        tap: {
          enabled: true
        },
        press: {
          enabled: true
        },
        pan: {
          horizontal: this.horizontal,
          vertical: this.vertical
        },
        swipe: {
          horizontal: this.horizontal,
          vertical: this.vertical
        },
        mouseWheel: {
          horizontal: this.horizontal,
          vertical: this.vertical
        },
        scroll: {
          enabled: true
        }
      },
      snapping: {
        toNearestChildElement: true
      }
    };
  },

  getCanvasBoundsOptions: function() {
    var options = Layout.prototype.getCanvasBoundsOptions();
    options.marginRight = 40;
    options.preventOverflowVertical = true;
    options.preventScrollbarVertical = true;
    return options;
  },

  getMoveToElementOffsets: function(/*element*/) {
    return {
      x: -this.padding,
      y: -this.padding
    };
  }
});

module.exports = ZoomLayout;

},{"../layout":13,"lodash":"lodash"}],20:[function(require,module,exports){
var _ = require("lodash");
var rect = require("../utils/rect");
var validate = require("../utils/validate");

/**
 * DOM manipulation helper module to encapsulate browser and DOM API version
 * differences.
 *
 * @module decks/ui/dom
 */
module.exports = {

  /**
   * Wrapper for querySelectorAll
   *
   * @param {!string} selector - DOM selector
   * @param {?HTMLElement} [context=document] - context element for DOM query
   * @return {NodeList}
   */
  query: function query(selector, context) {
    validate(selector, "selector", { isString: true });

    context = context || document;

    return context.querySelectorAll(selector);
  },

  /**
   * Wrapper for querySelector
   *
   * @param {!string} selector - DOM selector
   * @param {?Element} [context=document] - context element for DOM query
   * @return {undefined}
   */
  querySingle: function querySingle(selector, context) {
    validate(selector, "selector", { isString: true });

    context = context || document;

    return context.querySelector(selector);
  },

  /**
   * Creates a DOM element by name (e.g. "div").
   *
   * @param {!String} type - the type of DOM element to create (e.g. "div")
   * @returns {Element} - the DOM element
   */
  create: function create(type, options) {
    validate(type, "type", { isString: true });
    options = options || {};

    var element = document.createElement(type);

    if (_.has(options, "id")) {
      element.id = options.id;
    }

    if (_.has(options, "className")) {
      element.className = options.className;
    }

    if (_.has(options, "styles")) {
      this.setStyles(element, options.styles);
    }

    if (_.has(options, "attrs")) {
      this.setAttrs(element, options.attrs);
    }

    return element;
  },

  /**
   * Gets or sets an element's innerHTML.
   *
   * @param {!Element} element - the Element for which to get or set HTML.
   * @param {?String} data - the HTML to set, or if not specified, the method will return the HTML.
   * @return {String} - the element's innerHTML
   */
  html: function html(element, data) {
    if (!data) {
      return element.innerHTML;
    }

    if (_.isElement(data)) {
      element.innerHTML = data.outerHTML;
      return;
    }

    if (_.isString(data)) {
      element.innerHTML = data;
      return;
    }

    throw new Error("dom.create: cannot set element html");
  },

  /**
   * Parses an HTML string, and returns the resulting Element or Elements.
   *
   * @param {!string} html - the HTML string
   * @param {?Object} [options={}] - additional options
   * @param {?boolean} [options.multiple=false] - whether to return a all top-level sibling elements
   * @return {Element|NodeList} - the resulting Element or NodeList of elements
   */
  parse: function parse(html, options) {
    options = options || {};
    var element = this.create("dom");
    element.innerHTML = html;

    // Default to returning firstChild, unless options.multiple === true
    if (options.multiple) {
      return element.children;
    }

    return element.firstChild;
  },

  /**
   * Gets or sets the textContent/innerText of the Element
   *
   * @param element
   * @param data
   * @return {undefined}
   */
  text: function text(element, data) {
    if (!_.isString(data)) {
      return element.textContent || element.innerText;
    }

    if (!_.isUndefined(element.textContent)) {
      element.textContent = data;
    } else {
      element.innerText = data;
    }
  },

  /**
   * Empties an element by removing all children
   *
   * @param element
   * @return {undefined}
   */
  empty: function empty(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  },

  /**
   * Appends a child element to a parent element
   *
   * @param parent
   * @param child
   * @return {undefined}
   */
  append: function append(parent, child) {
    parent.appendChild(child);
  },

  /**
   * Prepends a child element in a parent element
   *
   * @param parent
   * @param child
   * @return {undefined}
   */
  prepend: function prepend(parent, child) {
    parent.insertBefore(child, parent.firstChild);
  },

  /**
   * Removes a child element from a parent element, or removes the parent element
   * from its parent if no child specified.
   *
   * @param parent
   * @param child
   * @return {undefined}
   */
  remove: function remove(parent, child) {
    if (!child) {
      return parent.parentNode.removeChild(parent);
    } else {
      return parent.removeChild(child);
    }
  },

  /**
   * Gets or sets an Element attribute value
   *
   * @param element
   * @param name
   * @param value
   * @return {undefined}
   */
  attr: function attr(element, name, value) {
    if (_.isUndefined(value)) {
      return this.getAttr(element, name);
    }
    this.setAttr(element, name, value);
  },

  /**
   * Gets an Element's attribute value by name
   *
   * @param element
   * @param name
   * @return {undefined}
   */
  getAttr: function getAttr(element, name) {
    return element.getAttribute(name);
  },

  /**
   * Sets an Element's attribute value by name
   *
   * @param element
   * @param name
   * @param value
   * @return {undefined}
   */
  setAttr: function setAttr(element, key, value) {
    element.setAttribute(key, value);
  },

  setAttrs: function setAttrs(element, attrs) {
    _.each(attrs, function(value, key) {
      this.setAttr(element, key, value);
    }, this);
  },

  /**
   * Indicates if an Element has the given class
   *
   * @param element
   * @param className
   * @return {undefined}
   */
  hasClass: function hasClass(element, className) {
    if (element.classList) {
      return element.classList.contains(className);
    } else {
      return new RegExp('(^| )' + className + '( |$)', 'gi').test(element.className);
    }
  },

  addClass: function addClass(element, className) {
    var classNames = _.map(className.split(" "), function(name) {
      return name.trim();
    });

    _.each(classNames, function(className) {
      if (this.hasClass(element, className)) { return; }
      if (element.classList) {
        element.classList.add(className);
      } else {
        element.className += ' ' + className;
      }
    }, this);
  },

  removeClass: function removeClass(element, className) {
    var classNames = _.map(className.split(" "), function(className) {
      return className.trim();
    });

    _.each(classNames, function(className) {
      if (!this.hasClass(element, className)) { return; }
      if (element.classList) {
        element.classList.remove(className);
      } else {
        element.className = element.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
      }
    }, this);
  },

  toggleClass: function toggleClass(element, className) {
    if (element.classList) {
      element.classList.toggle(className);
    } else {
      var classes = element.className.split(' ');
      var existingIndex = -1;
      for (var i = classes.length; i--;) {
        if (classes[i] === className) {
          existingIndex = i;
        }
      }

      if (existingIndex >= 0) {
        classes.splice(existingIndex, 1);
      } else {
        classes.push(className);
      }

      element.className = classes.join(' ');
    }
  },

  getStyle: function getStyle(element, name, options) {
    options = options || {};

    var value = element.style[name];

    if (options.parseInt) {
      value = _.parseInt(value);
    }

    if (options.parseFloat) {
      value = parseFloat(value);
    }

    return value;
  },

  setStyle: function setStyle(element, name, value) {
    if (_.isNumber(value)) {
      var unit = this.autoUnits[name];
      if (unit) {
        value = value + unit;
      }
    }
    element.style[name] = value;
  },

  setStyles: function setStyles(element, styles) {
    _.each(styles, function(value, key) {
      this.setStyle(element, key, value);
    }, this);
  },

  removeStyle: function removeStyle(element, name) {
    element.style[name] = "";
  },

  isPositioned: function isPositioned(element) {
    var position = this.getStyle(element, "position");
    return _.contains(["absolute", "relative", "fixed"], position);
  },

  isVisible: function(element) {
    validate(element, "element", { isElement: true });

    return element.style.display !== "none" &&
      element.style.visibility !== "hidden";
  },

  closest: function closest(element, predicate) {
    if (element && predicate(element)) {
      return element;
    }

    if (element.parentNode) {
      return this.closest(element.parentNode, predicate);
    }

    return null;
  },

  closestWithClass: function closestWithClass(element, className) {
    var self = this;
    return self.closest(element, function(el) {
      return self.hasClass(el, className);
    });
  },

  /**
   * Get the element whose bounding rect top/left is nearest to the given point in
   * distance.
   *
   * @param {!Object} point - the point to compare all elements to (in top/left or x/y)
   * @param {!(Element[]|NodeList)} elements - the elements to check
   * @return {Element} - the element whose top/left is nearest to point
   */
  nearest: function nearest(point, elements, options) {
    options = options || {};

    var minDistance = Infinity;

    if (options.ignoreInvisibleElements) {
      elements = _.filter(elements, function(element) {
        return this.isVisible(element);
      }, this);
    }

    return _.reduce(elements, function(nearestElement, element) {
      var elementRect = rect.normalize(element);
      var distance = rect.distance(point, elementRect);
      if (distance < minDistance) {
        minDistance = distance;
        return element;
      }
      return nearestElement;
    }, null);
  },

  /**
   * Default tolerance value for isOverflowed methods
   */
  defaultOverflowTolerance: 2,

  /**
   * Indicates if an element is overflowing it's parent in the horizontal direction.
   *
   * @param {!Element} element - element to check
   * @param {?number} [tolerance=2] - tolerance to add to element.clientWidth
   * @return {boolean} - whether element is overflowed horizontally
   */
  isOverflowedX: function isOverflowedX(element, tolerance) {
    tolerance = _.isNumber(tolerance) ? tolerance : this.defaultOverflowTolerance;
    return element.clientWidth + tolerance < element.scrollWidth;
  },

  /**
   * Indicates if an element is overflowing it's parent in the vertical direction.
   *
   * @param {!Element} element - element to check
   * @param {?number} [tolerance=2] - tolerance to add to element.clientHeight
   * @return {boolean} - whether element is overflowed vertically
   */
  isOverflowedY: function isOverflowedY(element, tolerance) {
    tolerance = _.isNumber(tolerance) ? tolerance : this.defaultOverflowTolerance;
    return element.clientHeight + tolerance < element.scrollHeight;
  },

  /**
   * Indicates if an element is overflowing it's parent in any direction.
   *
   * @param {!Element} element - element to check
   * @param {?number} [tolerance=2] - tolerance to add to element.clientHeight and element.clientWidth
   * @return {boolean} - whether element is overflowed
   */
  isOverflowed: function isOverflowed(element, tolerance) {
    return this.isOverflowedX(element, tolerance) || this.isOverflowedY(element, tolerance);
  },

  autoUnits: {
    "top": "px",
    "bottom": "px",
    "left": "px",
    "right": "px",
    "width": "px",
    "height": "px"
  }
};

},{"../utils/rect":35,"../utils/validate":36,"lodash":"lodash"}],21:[function(require,module,exports){
var _ = require("lodash");
var binder = require("../events").binder;
var hasEmitter = require("../events").hasEmitter;
var validate = require("../utils/validate");

/**
 * Base class for gesture emitters.
 *
 * The purpose of this class is to abstract away different types of gesture and UI events
 * and re-emit the events in a normalized structures ({@link DecksEvent}), via a decks {@link Emitter}.
 *
 * @class
 * @abstract
 * @mixes binder
 * @mixes hasEmitter
 * @param {!Object} options - gesture configuration options
 * @param {?(Emitter|Object)} [options.emitter={}] - Emitter instance or options on which to emit events
 * @param {!Element} options.element - Element for which to listen for and emit gesture/DOM events
 * @param {!Hammer} options.hammer - Hammer instance for the element
 * @param {boolean} options.enabled - whether this {@link GestureEmitter} is enabled (binds to/re-emits gesture events)
 */
function GestureEmitter(options) {
  if (!(this instanceof GestureEmitter)) {
    return new GestureEmitter(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  /**
   * Indicates if this emitter is enabled (listens for events, and forwards them on the {@link Emitter})
   */
  this.enabled = !!options.enabled;

  this.setEmitter(options.emitter || {});
  this.setElement(options.element);
  this.setHammer(options.hammer);

  // Note: don't this.bind() here - let subclass bind after setting up other options
}

_.extend(GestureEmitter.prototype, binder, hasEmitter, /** @lends GestureEmitter.prototype */ {
  /**
   * Default options
   */
  defaultOptions: {
    /**
     * Whether this {@link GestureEmitter} is enabled - defaults to false
     */
    enabled: false
  },

  /**
   * Sets the Element monitored by this {@link GestureEmitter}
   *
   * @param {!Element} element - element to monitor
   * @return {undefined}
   */
  setElement: function setElement(element) {
    validate(element, "element", { isElement: true, isNotSet: this.element });
    this.element = element;
  },

  /**
   * Sets the Hammer instance for this {@link GestureEmitter}
   *
   * The Hammer instance also wraps the element, and recognizes gestures.
   *
   * @param hammer
   * @return {undefined}
   */
  setHammer: function setHammer(hammer) {
    validate(hammer, "hammer", { isRequired: true, isNotSet: this.hammer });
    this.hammer = hammer;
  },

  /**
   * Gets a map of Element/DOM event names to method names for which to bind.
   *
   * This method should be implemented by a subclass, if the subclass is interested in DOM element-level
   * events.
   *
   * @return {undefined}
   */
  getElementEvents: function getElementEvents() {
    return {};
  },

  /**
   * Binds all of the Element-level events specified by {@link GestureEmitter#getElementEvents}
   *
   * @return {undefined}
   */
  bindElementEvents: function bindElementEvents() {
    if (!this.enabled) {
      return;
    }
    this.bindEvents(this.element, this.getElementEvents());
  },

  /**
   * Unbinds all the Element-level events specified by {@link GestureEmitter#getElementEvents}
   *
   * @return {undefined}
   */
  unbindElementEvents: function unbindElementEvents() {
    if (!this.enabled) {
      return;
    }
    this.unbindEvents(this.element, this.getElementEvents());
  },

  /**
   * Gets a map of Hammer event names to method names for which to bind.
   *
   * This method should be implemented by the subclass, if the subclass is interested in Hammer
   * events.
   *
   * @return {undefined}
   */
  getHammerEvents: function getHammerEvents() {
    return {};
  },

  /**
   * Binds to Hammer events specified by {@link GestureEmitter#getHammerEvents}
   *
   * @return {undefined}
   */
  bindHammerEvents: function bindHammerEvents() {
    if (!this.enabled) {
      return;
    }
    this.bindEvents(this.hammer, this.getHammerEvents());
  },

  /**
   * Unbinds from hammer events specified by {@link GestureEmitter#getHammerEvents}
   *
   * @return {undefined}
   */
  unbindHammerEvents: function unbindHammerEvents() {
    if (!this.enabled) {
      return;
    }
    this.unbindEvents(this.hammer, this.getHammerEvents());
  },

  /**
   * Binds all events (element and Hammer)
   *
   * @return {undefined}
   */
  bind: function bind() {
    this.bindElementEvents();
    this.bindHammerEvents();
  },

  /**
   * Unbinds all events (element and Hammer)
   *
   * @return {undefined}
   */
  unbind: function unbind() {
    this.unbindElementEvents();
    this.unbindHammerEvents();
  },

  /**
   * Destroys this instance by unbinding from all bound events (Element-level, and Hammer).
   *
   * @return {undefined}
   */
  destroy: function destroy() {
    this.unbind();
  }
});

module.exports = GestureEmitter;

},{"../events":8,"../utils/validate":36,"lodash":"lodash"}],22:[function(require,module,exports){
var _ = require("lodash");
var Hammer = require("hammerjs");
var binder = require("../events").binder;
var hasEmitter = require("../events").hasEmitter;
var dom = require("../ui/dom");
var rect = require("../utils").rect;
var DecksEvent = require("../events").DecksEvent;
var PanEmitter = require("./panemitter");
var SwipeEmitter = require("./swipeemitter");
var MouseWheelEmitter = require("./mousewheelemitter");
var MouseOverOutEmitter = require("./mouseoveroutemitter");
var MouseEnterLeaveEmitter = require("./mouseenterleaveemitter");
var TapEmitter = require("./tapemitter");
var PressEmitter = require("./pressemitter");
var ScrollEmitter = require("./scrollemitter");
var validate = require("../utils/validate");
//var raf = require("raf");

/**
 * Object to bind and handle gesture events for a single DOM element.
 *
 * @class
 * @mixes binder
 * @mixes hasEmitter
 * @param {!Object} options - additional options
 * @param {!Element} options.element - element for which to handle gestures
 * @param {?Emitter} [options.emitter={}] - {@link Emitter} instance or options
 * @param {!Object} options.animator - animator object
 * @param {!Object} options.config - config object
 * @param {?Object} options.gestures - gesture emitter options
 * @param {?Element} options.containerElement - container element for this element
 * @param {?Object} options.bounds - rectangle-like boundary for gestures/animations
 */
function GestureHandler(options) {
  if (!(this instanceof GestureHandler)) {
    return new GestureHandler(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  this.gestureEmitters = {};
  this.animationCount = 0;
  this.debouncedOnGestureScroll = _.debounce(this.onGestureScroll, options.movement.debouncedScrollWait);

  this.setAnimator(options.animator);
  this.setConfig(options.config);
  this.setEmitter(options.emitter || {});
  this.setElement(options.element);
  this.setOptions(options);

  this.bind();
}

_.extend(GestureHandler.prototype, binder, hasEmitter, /** @lends GestureHandler.prototype */ {
  /**
   * Default options to use with a GestureHandler instance.
   */
  defaultOptions: {
    /**
     * Gesture types
     */
    gestures: {
      /**
       * Mousewheel events
       */
      mouseWheel: {
        enabled: false,
        horizontal: true,
        vertical: true
      },

      /**
       * Mouse over/out events
       */
      mouseOverOut: {
        enabled: false,
        over: true,
        out: true
      },

      /**
       * Mouse enter/leave events
       */
      mouseEnterLeave: {
        enabled: false,
        enter: true,
        leave: true
      },

      /**
       * Pan events
       */
      pan: {
        enabled: false,
        horizontal: false,
        vertical: true
      },

      /**
       * Swipe events
       */
      swipe: {
        enabled: false,
        horizontal: false,
        vertical: true
      },

      /**
       * Tap events
       */
      tap: {
        enabled: false
      },

      /**
       * Press events
       */
      press: {
        enabled: false
      },

      /**
       * Scroll events (on the container)
       */
      scroll: {
        enabled: false
      }
    },

    /**
     * The container element in which this element resides
     */
    containerElement: null,

    /**
     * Boundary for animations/gestures (can be a real element bounds, or just virtual bounds)
     */
    bounds: null,

    /**
     * Function which provides additional x/y offsets to apply when animating to a child element
     * e.g. for snap to nearest child element, or move to element
     */
    getMoveToElementOffsets: function() {
      return {
        x: 0,
        y: 0
      };
    },

    /**
     * Movement options
     */
    movement: {
      scroll: false, // false: move by changing top/left, true: move by changing scrollTop/scrollLeft on container
      debouncedScrollWait: 600,
      swipingTimeout: 30,
      animateOptions: {
        duration: 500,
        easing: "easeInOutCubic"
      }
    },

    /**
     * Snapping options
     */
    snapping: {
      toBounds: false,
      toNearestChildElement: false,
      childElementSelector: ".decks-item",
      reduceMovementAtBounds: false,
      hardStopAtBounds: false,
      distanceThreshold: 40, // The pixel distance when pulling away from an edge, where movement resistance begins to be applied
      distanceScale: 0.5, // The scale factor for reducing movement when pulling away from an edge
      animateOptions: {
        duration: 500,
        easing: [500, 20] // tension (default 500), friction (default 20)
      }
    },

    /**
     * Inertial movement options
     */
    inertia: {
      distanceScale: 500, // 400 used to calculate the movement distance for an inertia-based movement (swipe gesture)
      durationScale: 500, // 60 used to calculate the movement duration for an inertia-based movement (swipe gesture)
      animateOptions: {
        easing: "easeOutCubic"
      }
    }
  },

  /**
   * Mapping of gesture names to gesture emitter component constructor functions
   */
  gestureEmitterTypes: {
    pan: PanEmitter,
    swipe: SwipeEmitter,
    mouseWheel: MouseWheelEmitter,
    mouseOverOut: MouseOverOutEmitter,
    mouseEnterLeave: MouseEnterLeaveEmitter,
    tap: TapEmitter,
    press: PressEmitter,
    scroll: ScrollEmitter
  },

  getEmitterEvents: function() {
    return {
      // Pan gestures - linear tracking movement
      "gesture:pan:start": "onGesturePanStart",
      "gesture:pan:any": "onGesturePanAny",
      "gesture:pan:x": "onGesturePanX",
      "gesture:pan:y": "onGesturePanY",
      "gesture:pan:end": "onGesturePanEnd",
      "gesture:pan:cancel": "onGesturePanCancel",

      // Swipe gestures - inertial movement in swipe direction
      "gesture:swipe:any": "onGestureSwipeAny",
      "gesture:swipe:x": "onGestureSwipeX",
      "gesture:swipe:y": "onGestureSwipeY",

      // Tap/press gestures
      "gesture:tap": "onGestureTap",
      "gesture:press": "onGesturePress",

      // Scroll
      "gesture:scroll": "debouncedOnGestureScroll"
    };
  },

  /**
   * Binds all {@link GestureHandler} events handlers.
   *
   * @return {undefined}
   */
  bind: function bind() {
    this.bindEvents(this.emitter, this.getEmitterEvents());
  },

  /**
   * Unbinds all {@link GestureHandler} event handlers.
   *
   * @return {undefined}
   */
  unbind: function unbind() {
    this.unbindEvents(this.emitter, this.getEmitterEvents());
  },

  /**
   * Destroys the GestureHandler and all GestureEmitter instances
   *
   * @return {undefined}
   */
  destroy: function destroy() {
    _.each(this.gestureEmitters, function(gestureEmitter, key) {
      if (this.config.debugGestures) {
        console.log("GestureHandler#destroy: destroying gesture emitter: " + key);
      }

      gestureEmitter.destroy();

      delete this.gestureEmitters[key];
    }, this);

    if (this.config.debugGestures) {
      console.log("GestureHandler#destroy: destroying hammer: ", this.hammer);
    }

    // Destory the Hammer instance
    this.hammer.destroy();
    delete this.hammer;

    this.unbind();
  },

  /**
   * Sets the animator instance
   *
   * @param animator
   * @return {undefined}
   */
  setAnimator: function setAnimator(animator) {
    validate(animator, "GestureHandler#setAnimator: animator", { isPlainObject: true, isNotSet: this.animator });
    this.animator = animator;
  },

  /**
   * Sets the config instance
   *
   * @param config
   * @return {undefined}
   */
  setConfig: function setConfig(config) {
    validate(config, "GestureHandler#setConfig: config", { isPlainObject: true, isNotSet: this.config });
    this.config = config;
  },

  /**
   * Sets the element instance
   *
   * @param element
   * @return {undefined}
   */
  setElement: function setElement(element) {
    validate(element, "GestureHandler#setElement: element", { isElement: true, isNotSet: this.element });
    this.element = element;
    this.hammer = new Hammer(this.element);
  },

  /**
   * Sets GestureHandler options
   *
   * @param options
   * @return {undefined}
   */
  setOptions: function setOptions(options) {
    validate(options, "GestureHandler#setOptions: options", { isRequired: true });

    // Container element (optional)
    this.containerElement = options.containerElement;

    // Bounds (optional)
    this.setBounds(options.bounds);

    // Movement options
    this.movement = options.movement;

    if (this.movement.scroll && !_.isElement(this.containerElement)) {
      throw new Error("GestureHandler#setOptions: for options.movement.scroll === true, options.containerElement must be an element");
    }

    // Snapping options
    this.snapping = options.snapping;

    if (this.snapping.toBounds && !this.bounds) {
      throw new Error("GestureHandler#setOptions: for options.snapping.toBounds === true, options.bounds is required");
    }

    if (this.snapping.toNearestChildElement && !_.isString(this.snapping.childElementSelector)) {
      throw new Error("GestureHandler#setOptions: for options.snapping.toNearestChildElement === true, options.snapping.childElementSelector is required");
    }

    // Inertia options
    this.inertia = options.inertia;

    // Other callbacks/etc.
    if (!_.isFunction(options.getMoveToElementOffsets)) {
      throw new Error("GestureHandler#setOptions: getMoveToElementOffsets must be a function");
    }

    this.getMoveToElementOffsets = options.getMoveToElementOffsets;

    // Gesture types
    _.each(options.gestures, function(gestureEmitterOptions, key) {
      // Get the constructor function for this type of gesture emitter
      var GestureEmitter = this.gestureEmitterTypes[key];

      if (!GestureEmitter) {
        throw new Error("GestureHandler#setOptions: no gesture emitter component configured to handle gesture type: " + key);
      }

      var element = this.element;

      if (key === "scroll") {
        // Scroll emitter must be on the container element, not the element itself
        element = this.containerElement || this.element;
        gestureEmitterOptions.enabled = gestureEmitterOptions.enabled && this.movement.scroll;

        if (gestureEmitterOptions.enabled && !this.containerElement) {
          if (!this.containerElement) {
            throw new Error("GestureHandler#setOptions: for scroll gestures, options.containerElement is required");
          }
        }
      }

      _.extend(gestureEmitterOptions, {
        element: element,
        hammer: this.hammer,
        emitter: this.emitter
      });

      this.gestureEmitters[key] = new GestureEmitter(gestureEmitterOptions);
    }, this);
  },

  /**
   * Sets the bounds for the gestures/animations
   *
   * @param bounds
   * @return {undefined}
   */
  setBounds: function setBounds(bounds) {
    if (!bounds && _.isElement(this.containerElement)) {
      bounds = rect.normalize(this.containerElement);
    }

    if (rect.isEqual(this.bounds, bounds)) {
      return;
    }

    this.bounds = bounds;
  },

  /**
   * Updates the current position data (and sets the start position if not set)
   *
   * @param e
   * @return {undefined}
   */
  updatePositionData: function updatePositionData(e) {
    this.currentPosition = {
      event: e
    };

    // If moving by scroll, record the starting scroll top and left, otherwise, record the style top and left
    if (this.movement.scroll) {
      _.extend(this.currentPosition, {
        scrollTop: this.containerElement.scrollTop,
        scrollLeft: this.containerElement.scrollLeft
      });
    } else {
      _.extend(this.currentPosition, rect.normalize(this.element));
    }

    /*
    if (this.config.debugGestures) {
      console.log("set current position " + this.element.id, this.currentPosition);
    }
    */

    if (!this.startPosition) {
      this.startPosition = this.currentPosition;

      if (this.element.parentNode) {
        this.parentPosition = rect.normalize(this.element.parentNode);
      }

      /*
      if (this.config.debugGestures) {
        console.log("set start position " + this.element.id, this.startPosition);
      }
      */
    }
  },

  /**
   * Clears the current and start position data
   *
   * @return {undefined}
   */
  clearPositionData: function clearPositionData() {
    if (this.config.debugGestures) {
      console.log("clear position", this.element.id);
    }
    this.startPosition = null;
    this.currentPosition = null;
    this.parentPosition = null;
  },

  /**
   * Indicates if the element has any animation running currently.
   *
   * @return {undefined}
   */
  isAnimating: function isAnimating() {
    return this.animationCount > 0;
  },

  /**
   * Stops the current animation (if possible) and clears the animation queue for the element
   *
   * Note: only queued animations can be stopped.  Animations with "queue: false" don't seem
   * to be stoppable.
   *
   * @return {undefined}
   */
  stopAnimation: function stopAnimation() {
    if (this.config.debugGestures) {
      console.log("stop", this.element.id);
    }
    this.animator.animate(this.element, "stop", true);
    this.animationCount = 0;
  },

  /**
   * Moves the element using the information in the given Hammer event object.
   *
   * @param e - hammer pan event object (from a panmove|panleft|panright|etc.)
   * @param elementRect - the bounding client rect of the element
   * @return {undefined}
   */
  animateMoveForPan: function animateMoveForPan(e, animateOptions, beginOptions, completeOptions) {
    completeOptions.waitForXAndY = true;
    this.animateMoveForPanX(e, animateOptions, beginOptions, completeOptions);
    this.animateMoveForPanY(e, animateOptions, beginOptions, completeOptions);
  },

  /**
   * Moves the element horizontally, using the information in the given hammer event object.
   *
   * @param e
   * @param elementRect
   * @return {undefined}
   */
  animateMoveForPanX: function animateMoveForPanX(e, animateOptions, beginOptions, completeOptions) {
    var x;

    if (this.movement.scroll) {
      x = this.startPosition.scrollLeft - e.deltaX;
    } else {
      x = this.startPosition.left - this.parentPosition.left + e.deltaX;

      // Limit movement if the user is dragging the element towards the inside of the container bounds
      if (this.snapping.reduceMovementAtBounds && this.bounds && this.snapping.distanceThreshold) {
        if ((this.currentPosition.left - this.bounds.left) > this.snapping.distanceThreshold) {
          x = (this.startPosition.left + this.snapping.distanceThreshold) +
            ((e.deltaX - this.snapping.distanceThreshold) * this.snapping.distanceScale);
        } else if ((this.bounds.right - this.currentPosition.right) > this.snapping.distanceThreshold) {
          x = (this.startPosition.left - this.snapping.distanceThreshold) +
            ((e.deltaX + this.snapping.distanceThreshold) * this.snapping.distanceScale);
        }
      }

      // Don't allow pan movement to go beyond bounds
      if (this.snapping.hardStopAtBounds) {
        if (x + this.currentPosition.width + this.parentPosition.left > this.bounds.right) {
          x = this.bounds.right - this.currentPosition.width - this.parentPosition.left;
        }

        if (x + this.parentPosition.left < this.bounds.left) {
          x = this.bounds.left - this.parentPosition.left;
        }
      }
    }

    _.extend(animateOptions, {
      duration: 0 // Immediate animation for pan movements
    });

    _.extend(completeOptions, {
      snapToBounds: false, // Don't snap to bounds for single pan events (wait for pan end)
      snapToNearestChildElement: false, // Don't snap for single pan events (wait for pan end)
      clearPositionData: false // Don't clear position data, because pan events need the past data
    });

    this.animateMoveX(x, animateOptions, beginOptions, completeOptions);
  },

  /**
   * Moves the element vertically, using the information in the given hammer event object.
   *
   * @param e
   * @param elementRect
   * @return {undefined}
   */
  animateMoveForPanY: function animateMoveForPanY(e, animateOptions, beginOptions, completeOptions) {
    var y;

    if (this.movement.scroll) {
      y = this.startPosition.scrollTop - e.deltaY;
    } else {
      y = this.startPosition.top - this.parentPosition.top + e.deltaY;

      // Limit movement if the user is dragging the element towards the inside of the container bounds
      if (this.snapping.reduceMovementAtBounds && this.bounds && this.snapping.distanceThreshold) {
        if ((this.currentPosition.top - this.bounds.top) > this.snapping.distanceThreshold) {
          y = (this.startPosition.top + this.snapping.distanceThreshold) +
            ((e.deltaY - this.snapping.distanceThreshold) * this.snapping.distanceScale);
        } else if ((this.bounds.bottom - this.currentPosition.bottom) > this.snapping.distanceThreshold) {
          y = (this.startPosition.top - this.snapping.distanceThreshold) +
            ((e.deltaY + this.snapping.distanceThreshold) * this.snapping.distanceScale);
        }
      }

      // Don't allow the pan position to go beyond bounds
      if (this.snapping.hardStopAtBounds) {
        if (y + this.currentPosition.height + this.parentPosition.top > this.bounds.bottom) {
          y = this.bounds.bottom - this.currentPosition.height - this.parentPosition.top;
        }

        if (y + this.parentPosition.top < this.bounds.top) {
          y = this.bounds.top - this.parentPosition.top;
        }
      }
    }

    _.extend(animateOptions, {
      duration: 0 // Immediate animation for pan movements
    });

    _.extend(completeOptions, {
      snapToBounds: false, // Don't snap to bounds for pans (do it on pan end)
      snapToNearestChildElement: false, // Don't snap to bounds for pans (do it on pan end)
      clearPositionData: false // Don't clear position data - pan movements need past data
    });

    this.animateMoveY(y, animateOptions, beginOptions, completeOptions);
  },

  /**
   * Starts a horizontal and/or vertical movement animation using the
   * information in the given Hammer event object.
   *
   * @param e
   * @return {undefined}
   */
  animateMoveForSwipe: function animateMoveForSwipe(e, animateOptions, beginOptions, completeOptions) {
    completeOptions.waitForXAndY = true;
    this.animateMoveForSwipeX(e, animateOptions, beginOptions, completeOptions);
    this.animateMoveForSwipeY(e, animateOptions, beginOptions, completeOptions);
  },

  /**
   * Starts an animation for a swipe gesture in the horizontal direction.
   *
   * @param e
   * @param animateOptions
   * @param beginOptions
   * @param completeOptions
   * @return {undefined}
   */
  animateMoveForSwipeX: function animateMoveForSwipeX(e, animateOptions, beginOptions, completeOptions) {
    var distance = this.getInertiaDistance(e.velocityX);
    var duration = this.getInertiaDuration(e.velocityX);
    var x;

    if (this.movement.scroll) {
      x = this.currentPosition.scrollLeft + distance;
    } else {
      x = "-=" + distance;

      if (this.snapping.hardStopAtBounds) {
        /*
        if (this.element.id === "decks-item-1-0") {
          console.log("----------");
          console.log("this.element.id", this.element.id);
          console.log("this.startPosition", this.startPosition);
          console.log("this.currentPosition", this.currentPosition);
          console.log("this.parentPosition", this.parentPosition);
          console.log("this.bounds", this.bounds);
          console.log("distance", distance);
        }
        */
        if (distance > 0) {
          //console.log("left");
          // If moving to the left, stop the element at the left bounds
          if (this.currentPosition.left - distance < this.bounds.left) {
            x = this.bounds.left - this.parentPosition.left;
            duration = duration * (this.currentPosition.left - this.bounds.left) / distance;
          }
        } else {
          //console.log("right");
          // If moving to the right, stop the element at the right bounds
          if (this.currentPosition.right - distance > this.bounds.right) {
            x = this.bounds.right - this.currentPosition.width - this.parentPosition.left;
            duration = duration * (this.bounds.right - this.currentPosition.right) / -distance;
          }
        }
      }
    }

    //console.log("duration", duration);

    _.extend(animateOptions, this.inertia.animateOptions, {
      duration: duration
    });

    _.extend(completeOptions, {
      snapToBounds: false,
      snapToNearestChildElement: false,
      clearPositionData: true
    });


    this.animateMoveX(x, animateOptions, beginOptions, completeOptions);
  },

  /**
   * Starts an animation for a swipe gestures in the vertical direction.
   *
   * @param e
   * @param animateOptions
   * @param beginOptions
   * @param completeOptions
   * @return {undefined}
   */
  animateMoveForSwipeY: function animateMoveForSwipeY(e, animateOptions, beginOptions, completeOptions) {
    var distance = this.getInertiaDistance(e.velocityY);
    var duration = this.getInertiaDuration(e.velocityY);
    var y;

    if (this.movement.scroll) {
      y = this.currentPosition.scrollTop + distance;
    } else {
      y = "-=" + distance;

      if (this.snapping.hardStopAtBounds) {
        /*
        if (this.element.id === "decks-item-1-0") {
          console.log("----------");
          console.log("this.element.id", this.element.id);
          console.log("this.startPosition", this.startPosition);
          console.log("this.currentPosition", this.currentPosition);
          console.log("this.parentPosition", this.parentPosition);
          console.log("this.bounds", this.bounds);
          console.log("distance", distance);
        }
        */
        if (distance > 0) {
          // If moving top, stop the element at the top bounds
          if (this.currentPosition.top - distance < this.bounds.top) {
            y = this.bounds.top - this.parentPosition.top;
            duration = duration * (this.currentPosition.top - this.bounds.top) / distance;
          }
        } else {
          // If moving , stop the element at the bottom bounds
          if (this.currentPosition.bottom - distance > this.bounds.bottom) {
            y = this.bounds.bottom - this.currentPosition.width - this.parentPosition.top;
            duration = duration * (this.bounds.bottom - this.currentPosition.bottom) / -distance;
          }
        }
      }
    }

    _.extend(animateOptions, this.inertia.animateOptions, {
      duration: duration
    });

    _.extend(completeOptions, {
      snapToBounds: false,
      snapToNearestChildElement: false,
      clearPositionData: true
    });

    this.animateMoveY(y, animateOptions, beginOptions, completeOptions);
  },

  /**
   * Animates a movement in the horizontal direction.
   *
   * @param x
   * @param animateOptions
   * @param beginOptions
   * @param completeOptions
   * @return {undefined}
   */
  animateMoveX: function animateMoveX(x, animateOptions, beginOptions, completeOptions) {
    this.animateMoveXOrY(x, "x", animateOptions, beginOptions, completeOptions);
  },

  /**
   * Animates a movement in the vertical direction.
   *
   * @param y
   * @param animateOptions
   * @param beginOptions
   * @param completeOptions
   * @return {undefined}
   */
  animateMoveY: function animateMoveY(y, animateOptions, beginOptions, completeOptions) {
    this.animateMoveXOrY(y, "y", animateOptions, beginOptions, completeOptions);
  },

  /**
   * Animates a movement in the horizontal and vertical directions.
   *
   * @param x
   * @param y
   * @param animateOptions
   * @param beginOptions
   * @param completeOptions
   * @return {undefined}
   */
  animateMoveXAndY: function animateMoveXAndY(x, y, animateOptions, beginOptions, completeOptions) {
    completeOptions.waitForXAndY = true;
    this.animateMoveX(x, animateOptions, beginOptions, completeOptions);
    this.animateMoveY(y, animateOptions, beginOptions, completeOptions);
  },

  /**
   * Animates a move in the horizontal or vertical direction (based on axis parameter)
   *
   * @param value
   * @param axis
   * @param animateOptions
   * @param beginOptions
   * @param completeOptions
   * @return {undefined}
   */
  animateMoveXOrY: function animateMoveXOrY(value, axis, animateOptions, beginOptions, completeOptions) {
    var self = this;
    var transform;

    if (self.movement.scroll) {
      transform = "scroll";
      animateOptions.offset = value;
      animateOptions.axis = axis;
      animateOptions.container = self.containerElement;
    } else {
      transform = {};
      if (axis === "x") {
        transform.left = value;
      } else {
        transform.top = value;
      }
    }

    // If waiting for x and y, wait for 2 invocations of the complete function
    // before actually calling it
    completeOptions.callCount = 0;

    animateOptions = _.extend({
      queue: false, // Don't queue any movement animations, they need to be immediate (or in parallel), and not queued to run in series
      complete: function() {
        if (completeOptions.waitForXAndY) {
          completeOptions.callCount++;
          if (completeOptions.callCount < 2) {
            return;
          }
        }
        self.onAnimationComplete(completeOptions);
      }
    }, this.movement.animateOptions, animateOptions);

    if (!beginOptions.silent) {
      this.emit(DecksEvent("gesture:element:moving", this, this.element));
    }

    self.animationCount++;
    self.animator.animate(self.element, transform, animateOptions);
  },

  /**
   * Gets the distance to travel for an inertial movement.
   *
   * @param velocity
   * @return {undefined}
   */
  getInertiaDistance: function getInertiaDistance(velocity) {
    return this.inertia.distanceScale * velocity;
  },

  /**
   * Gets the animation duration for an inertial movement.
   *
   * @param velocity
   * @return {undefined}
   */
  getInertiaDuration: function getInertiaDuration(velocity) {
    return Math.abs(this.inertia.durationScale * velocity);
  },

  /**
   * Animates a movement to reset the element to its origin position (0, 0).
   *
   * @return {undefined}
   */
  resetPosition: function resetPosition() {
    var animateOptions = {};
    var beginOptions = {};
    var completeOptions = {
      description: "reset position",
      waitForXAndY: true,
      snapToBounds: false,
      snapToNearestChildElement: false,
      clearPositionData: true
    };

    this.animateMoveXAndY(0, 0, animateOptions, beginOptions, completeOptions);
  },

  /**
   * Animates a movement to move the element to a position near the given child element.
   *
   * @param element
   * @param animateOptions
   * @param beginOptions
   * @param completeOptions
   * @return {undefined}
   */
  animateMoveToElement: function animateMoveToElement(element, animateOptions, beginOptions, completeOptions) {
    validate(element, "GestureHandler#animateMoveToElement: element", { isElement: true });

    var left = dom.getStyle(element, "left", { parseFloat: true });
    var top = dom.getStyle(element, "top", { parseFloat: true });

    var offsets = this.getMoveToElementOffsets(element);
    var x = left + offsets.x;
    var y = top + offsets.y;

    animateOptions = _.extend({}, animateOptions);
    beginOptions = _.extend({}, beginOptions);
    completeOptions = _.extend({
      description: "animateMoveToElement",
      waitForXAndY: true,
      snapToBounds: true,
      snapToNearestChildElement: false,
      clearPositionData: true,
      event: DecksEvent("gesture:moved:to:element", this, element)
    }, completeOptions);

    this.animateMoveXAndY(x, y, animateOptions, beginOptions, completeOptions);
  },

  /**
   * Snaps the element's position back to within its movement boundary.
   *
   * @return {undefined}
   */
  snapToBounds: function snapToBounds() {
    var self = this;

    // If we don't have container bounds, we can't snap to anything.
    // If we are moving by scrolling, we can't snap, because the browser doesn't let you pull the element inside the bounds.
    if (!self.bounds || self.movement.scroll) {
      return;
    }

    if (this.config.debugGestures) {
      console.log("snap bounds");
    }

    var x;
    if (this.currentPosition.left > self.bounds.left) {
      //x = 0;
      x = self.bounds.left - self.parentPosition.left;
    } else if (this.currentPosition.right < self.bounds.right) {
      x = "+=" + (self.bounds.right - this.currentPosition.right);
    }

    var y;
    if (this.currentPosition.top > self.bounds.top) {
      //y = 0;
      y = self.bounds.top - self.parentPosition.top;
    } else if (this.currentPosition.bottom < self.bounds.bottom) {
      y = "+=" + (self.bounds.bottom - this.currentPosition.bottom);
    }

    var animateOptions = _.extend({}, this.snapping.animateOptions);
    var beginOptions = {};
    var completeOptions = {
      description: "snap to bounds",
      snapToBounds: false,
      snapToNearestChildElement: false,
      clearPositionData: true,
      event: DecksEvent("gesture:snapped:to:container:bounds", this, this.element)
    };

    if (!_.isUndefined(x) && !_.isUndefined(y)) {
      this.animateMoveXAndY(x, y, animateOptions, beginOptions, completeOptions);
    } else if (!_.isUndefined(x)) {
      this.animateMoveX(x, animateOptions, beginOptions, completeOptions);
    } else if (!_.isUndefined(y)) {
      this.animateMoveY(y, animateOptions, beginOptions, completeOptions);
    }
  },

  /**
   * Snaps the element's position to a nearby child element.
   *
   * @return {undefined}
   */
  snapToNearestChildElement: function snapToNearestChildElement() {
    if (!this.snapping.toNearestChildElement || !_.isString(this.snapping.childElementSelector) || !this.bounds) {
      return;
    }

    if (this.config.debugGestures) {
      console.log("snap to nearest child element");
    }

    var childElements = dom.query(this.snapping.childElementSelector, this.containerElement);
    var nearestChildElement = dom.nearest(this.bounds, childElements, { ignoreInvisibleElements: true });

    var animateOptions = _.extend({}, this.snapping.animateOptions);
    var beginOptions = {};
    var completeOptions = {
      description: "snap to nearest child element",
      snapToBounds: true,
      snapToNearestChildElement: false,
      clearPositionData: true
    };

    this.animateMoveToElement(nearestChildElement, animateOptions, beginOptions, completeOptions);
  },

  /**
   * Sets a flag that indicates that the element is swiping.
   *
   * Flag is automatically cleared after a configurable timeout.
   *
   * @return {undefined}
   */
  setSwiping: function setSwiping() {
    var self = this;
    self.isSwiping = true;
    _.delay(function() {
      self.isSwiping = false;
    }, self.movement.swipingTimeout);
  },

  /**
   * Called when a movement animation is complete.
   *
   * @param options
   * @return {undefined}
   */
  onAnimationComplete: function onAnimationComplete(options) {
    var self = this;

    if (this.config.debugGestures) {
      console.log("complete: " + options.description + " " + this.element.id);
    }

    this.isPanningAny = false;
    this.isPanningX = false;
    this.isPanningY = false;

    // If waitForXAndY, two animations must complete before this method is called,
    // so decrement by 2.  Otherwise, decrement by 1.
    this.animationCount -= (options.waitForXAndY ? 2 : 1);

    _.defer(function() {
      // Snapping to nearest child gets precedence over snapping to bounds.
      // Snapping to bounds might be called after snapping to nearest child completes.
      if (options.snapToNearestChildElement) {
        self.snapToNearestChildElement();
      } else if (options.snapToBounds) {
        self.snapToBounds();
      }

      if (options.clearPositionData) {
        self.clearPositionData();
      }

      if (!options.silent) {
        if (options.event) {
          self.emit(options.event);
        }
        self.emit(DecksEvent("gesture:element:moved", self, self.element));
      }
    });
  },

  /**
   * Called when a pan gestures is started.
   *
   * @param e
   * @return {undefined}
   */
  onGesturePanStart: function onGesturePanStart(e, options) {
    options = options || {};
    var element = options.elementOverride || e.sender.element;
    if (element !== this.element) {
      return;
    }

    if (this.config.debugGestures) {
      console.log("pan start", this.element.id);
    }

    this.updatePositionData(e.data);
  },

  /**
   * Called when a pan gesture is detected in any direction.
   *
   * @param e
   * @return {undefined}
   */
  onGesturePanAny: function onGesturePanAny(e, options) {
    options = options || {};
    var element = options.elementOverride || e.sender.element;
    if (element !== this.element || this.isPanningAny || this.isSwiping) {
      return;
    }

    this.isPanningAny = true;

    if (this.config.debugGestures) {
      console.log("pan any", this.element.id);
    }

    if (this.isAnimating()) {
      this.stopAnimation();
      this.clearPositionData();
    }

    this.updatePositionData(e.data);

    var animateOptions = {};
    var beginOptions = {};
    var completeOptions = {
      description: "pan any",
      waitForXAndY: true
    };

    this.animateMoveForPan(e.data, animateOptions, beginOptions, completeOptions);
  },

  /**
   * Called when a pan gesture is detected in the horizontal direction.
   *
   * @param e
   * @return {undefined}
   */
  onGesturePanX: function onGesturePanX(e, options) {
    options = options || {};
    var element = options.elementOverride || e.sender.element;
    if (element !== this.element || this.isPanningX || this.isSwiping) {
      return;
    }

    this.isPanningX = true;

    if (this.config.debugGestures) {
      console.log("pan x", this.element.id);
    }

    if (this.isAnimating()) {
      this.stopAnimation();
      this.clearPositionData();
    }

    this.updatePositionData(e.data);

    var animateOptions = {};
    var beginOptions = {};
    var completeOptions = {
      description: "pan x",
      waitForXAndY: false
    };

    this.animateMoveForPanX(e.data, animateOptions, beginOptions, completeOptions);
  },

  /**
   * Called when a pan gesture is detected in the vertical direction.
   *
   * @param e
   * @return {undefined}
   */
  onGesturePanY: function onGesturePanY(e, options) {
    options = options || {};
    var element = options.elementOverride || e.sender.element;
    if (element !== this.element || this.isPanningY || this.isSwiping) {
      return;
    }

    this.isPanningY = true;

    if (this.config.debugGestures) {
      console.log("pan y", this.element.id);
    }

    if (this.isAnimating()) {
      this.stopAnimation();
      this.clearPositionData();
    }

    this.updatePositionData(e.data);

    var animateOptions = {};
    var beginOptions = {};
    var completeOptions = {
      description: "pan y",
      waitForXAndY: false
    };

    this.animateMoveForPanY(e.data, animateOptions, beginOptions, completeOptions);
  },

  onGesturePanEnd: function onGesturePanEnd(e, options) {
    var self = this;
    options = options || {};
    var element = options.elementOverride || e.sender.element;
    if (element !== this.element || this.isSwiping) {
      return;
    }

    // Defer the completion of the pan for one tick, because sometimes the latest animation needs to finish
    _.defer(function() {
      if (self.config.debugGestures) {
        console.log("pan end: %s (is animating: %s)", self.element.id, self.isAnimating());
      }

      if (!self.isAnimating()) {
        self.clearPositionData();
      }
    });
  },

  onGesturePanCancel: function onGesturePanCancel(e, options) {
    options = options || {};
    var element = options.elementOverride || e.sender.element;
    if (element !== this.element) {
      return;
    }

    if (this.config.debugGestures) {
      console.log("pan cancel", this.element.id);
    }

    if (this.isAnimating()) {
      this.stopAnimation();
      this.clearPositionData();
    }
  },

  onGestureSwipeAny: function onGestureSwipeAny(e, options) {
    options = options || {};
    var element = options.elementOverride || e.sender.element;
    if (element !== this.element) {
      return;
    }
    this.setSwiping();
    this.stopAnimation();

    if (this.config.debugGestures) {
      console.log("swipe any", this.element.id);
    }

    var animateOptions = {};
    var beginOptions = {};
    var completeOptions = {
      description: "swipe any",
      waitForXAndY: true
    };

    this.animateMoveForSwipe(e.data, animateOptions, beginOptions, completeOptions);
  },

  onGestureSwipeX: function onGestureSwipeX(e, options) {
    options = options || {};
    var element = options.elementOverride || e.sender.element;
    if (element !== this.element) {
      return;
    }
    this.setSwiping();
    this.stopAnimation();

    if (this.config.debugGestures) {
      console.log("swipe x", this.element.id);
    }

    var animateOptions = {};
    var beginOptions = {};
    var completeOptions = {
      description: "swipe x",
      waitForXAndY: false
    };

    this.animateMoveForSwipeX(e.data, animateOptions, beginOptions, completeOptions);
  },

  onGestureSwipeY: function onGestureSwipeY(e, options) {
    options = options || {};
    var element = options.elementOverride || e.sender.element;
    if (element !== this.element) {
      return;
    }
    this.setSwiping();
    this.stopAnimation();

    if (this.config.debugGestures) {
      console.log("swipe y", this.element.id);
    }

    var animateOptions = {};
    var beginOptions = {};
    var completeOptions = {
      description: "swipe y",
      waitForXAndY: false
    };
    this.animateMoveForSwipeY(e.data, animateOptions, beginOptions, completeOptions);
  },

  onGestureTap: function onGestureTap(e, options) {
    options = options || {};
    var element = options.elementOverride || e.sender.element;
    if (element !== this.element) {
      return;
    }

    if (this.config.debugGestures) {
      console.log("tap", this.element.id);
    }

    this.stopAnimation();
    this.clearPositionData();
  },

  onGesturePress: function onGesturePress(e, options) {
    options = options || {};
    var element = options.elementOverride || e.sender.element;
    if (element !== this.element) {
      return;
    }

    if (this.config.debugGestures) {
      console.log("press", this.element.id);
    }

    this.stopAnimation();
    this.clearPositionData();
  },

  onGestureScroll: function onGestureScroll(e, options) {
    options = options || {};
    var element = options.elementOverride || e.sender.element;
    if (element !== this.containerElement) {
      return;
    }

    if (this.config.debugGestures) {
      console.log("scroll", this.containerElement);
    }

    if (this.snapping.toNearestChildElement) {
      this.snapToNearestChildElement();
    } else if (this.snapping.toBounds) {
      this.snapToBounds();
    }
  }
});

module.exports = GestureHandler;

},{"../events":8,"../ui/dom":20,"../utils":34,"../utils/validate":36,"./mouseenterleaveemitter":25,"./mouseoveroutemitter":26,"./mousewheelemitter":27,"./panemitter":28,"./pressemitter":29,"./scrollemitter":30,"./swipeemitter":31,"./tapemitter":32,"hammerjs":"hammerjs","lodash":"lodash"}],23:[function(require,module,exports){
var _ = require("lodash");
var binder = require("../events/binder");
var hasEmitter = require("../events/hasemitter");
var GestureHandler = require("./gesturehandler");
var validate = require("../utils/validate");
var rect = require("../utils/rect");

/**
 * Manages a group of {@link GestureHandler}s.  When some types of gesture events are emitted
 * by any {@link GestureHandler} in the group, the event will be applied to all over {@link GestureHandler}s
 * in the group.  E.g. if you pan or swipe one element 10 pixels to the left, all the other gesture handlers
 * in the group will also be instructed to pan 10 pixels to the left.
 *
 * @class
 * @param {?Object} options - options
 * @return {GestureHandlerGroup}
 */
function GestureHandlerGroup(options) {
  if (!(this instanceof GestureHandlerGroup)) {
    return new GestureHandlerGroup(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  validate(options.containerElement, "options.containerElement", { isElement: true });

  this.gestures = options.gestures;
  this.paddingRight = options.paddingRight;
  this.paddingBottom = options.paddingBottom;
  this.gestureHandlers = [];
  this.containerElement = options.containerElement;

  this.setConfig(options.config);
  this.setEmitter(options.emitter || {});
  this.addGestureHandlers(options.gestureHandlers || []);

  this.bind();
}

_.extend(GestureHandlerGroup.prototype, binder, hasEmitter, /** @lends GestureHandlerGroup.prototype */ {
  defaultOptions: {
    gestures: {
      pan: {
        enabled: true,
        horizontal: true,
        vertical: false
      },
      swipe: {
        enabled: true,
        horizontal: true,
        vertical: false
      },
      tap: {
        enabled: true
      },
      press: {
        enabled: true
      }
    },
    paddingRight: 60,
    paddingBottom: 60
  },

  getEmitterEvents: function getEmitterEvents() {
    var emitterEvents = {};

    if (this.gestures.pan.enabled) {
      emitterEvents["gesture:pan:start"] = "onGesturePanStart";
      emitterEvents["gesture:pan:end"] = "onGesturePanEnd";
      emitterEvents["gesture:pan:cancel"] = "onGesturePanCancel";

      if (this.gestures.pan.horizontal && this.gestures.pan.vertical) {
        emitterEvents["gesture:pan:any"] = "onGesturePanAny";
      } else if (this.gestures.pan.vertical) {
        emitterEvents["gesture:pan:y"] = "onGesturePanY";
      } else if (this.gestures.pan.horizontal) {
        emitterEvents["gesture:pan:x"] = "onGesturePanX";
      }
    }

    if (this.gestures.swipe.enabled) {
      if (this.gestures.swipe.horizontal && this.gestures.swipe.vertical) {
        emitterEvents["gesture:swipe:any"] = "onGestureSwipeAny";
      } else if (this.gestures.swipe.vertical) {
        emitterEvents["gesture:swipe:y"] = "onGestureSwipeY";
      } else if (this.gestures.swipe.horizontal) {
        emitterEvents["gesture:swipe:x"] = "onGestureSwipeX";
      }
    }

    if (this.gestures.tap.enabled) {
      emitterEvents["gesture:tap"] = "onGestureTap";
    }

    if (this.gestures.press.enabled) {
      emitterEvents["gesture:press"] = "onGesturePress";
    }

    return emitterEvents;
  },

  bind: function bind() {
    var emitterEvents = this.getEmitterEvents();

    // Setup event handler methods for all interested events
    _.each(emitterEvents, function(methodName) {
      if (!_.isFunction(this[methodName])) {
        this[methodName] = this.applyGesture;
      }
    }, this);

    this.bindEvents(this.emitter, this.getEmitterEvents());

    _.each(this.gestureHandlers, function(gestureHandler) {
      gestureHandler.bind();
    }, this);
  },

  unbind: function unbind() {
    this.unbindEvents(this.emitter, this.getEmitterEvents());

    _.each(this.gestureHandlers, function(gestureHandler) {
      gestureHandler.unbind();
    }, this);
  },

  destroy: function destroy() {
    // Unbind from all events
    this.unbind();

    // Destroy all the gesture handlers
    _.each(this.gestureHandlers, function(gestureHandler) {
      gestureHandler.destroy();
    });

    this.gestureHandlers = [];
  },

  getEventHandlerMethodName: function getEventHandlerMethodName(e) {
    var emitterEvents = this.getEmitterEvents();
    return emitterEvents[e.type];
  },

  setConfig: function setConfig(config) {
    validate(config, "GestureHandlerGroup#setConfig: config", { isRequired: true, isNotSet: this.config });
    this.config = config;
  },

  hasGestureHandlerForElement: function hasGestureHandlerForElement(element) {
    return !!this.getGestureHandlerForElement(element);
  },

  getGestureHandlerForElement: function getGestureHandlerForElement(element) {
    validate(element, "element", { isElement: true });

    return _.find(this.gestureHandlers, function(gestureHandler) {
      return gestureHandler.element === element;
    });
  },

  removeGestureHandlerForElement: function removeGestureHandlerForElement(element, options) {
    var gestureHandler = this.getGestureHandlerForElement(element);

    if (!gestureHandler) {
      return;
    }

    return this.removeGestureHandler(gestureHandler, options);
  },

  hasGestureHandler: function hasGestureHandler(gestureHandler) {
    validate(gestureHandler, "gestureHandler", { isInstanceOf: GestureHandler });

    return _.contains(this.gestureHandlers, gestureHandler);
  },

  addGestureHandler: function addGestureHandler(gestureHandler) {
    validate(gestureHandler, "gestureHandler", { isInstanceOf: GestureHandler });

    if (this.hasGestureHandler(gestureHandler)) {
      return;
    }

    this.gestureHandlers.push(gestureHandler);

    this.updateBounds();

    return gestureHandler;
  },

  addGestureHandlers: function addGestureHandlers(gestureHandlers) {
    validate(gestureHandlers, "gestureHandlers", { isArray: true });

    return _.map(gestureHandlers, function(gestureHandler) {
      return this.addGestureHandler(gestureHandler);
    }, this);
  },

  removeGestureHandler: function removeGestureHandler(gestureHandler, options) {
    validate(gestureHandler, "gestureHandler", { isInstanceOf: GestureHandler });
    options = options || {};

    if (!this.hasGestureHandler(gestureHandler)) {
      return;
    }

    _.pull(this.gestureHandlers, gestureHandler);

    if (options.destroy) {
      gestureHandler.destroy();
    }

    this.updateBounds();

    return gestureHandler;
  },

  applyGesture: function applyGesture(e) {
    validate(e, "GestureHandlerGroup#applyGesture: e", { isRequired: true });

    var methodName = this.getEventHandlerMethodName(e);

    _.each(this.gestureHandlers, function(gestureHandler) {
      // Don't apply the gesture to the element that originally emitted the event (it's already handled by that gesture handler)
      // Don't apply the gesture to elements that aren't in this gesture handler group
      if (gestureHandler.element === e.sender.element || !this.hasGestureHandlerForElement(e.sender.element)) {
        return;
      }

      // Allows the event to be handled by a GestureHandler that does not match the element
      // that emitted the event
      var options = {
        elementOverride: gestureHandler.element
      };

      gestureHandler[methodName](e, options);
    }, this);
  },

  /**
   * Gets all of the elements managed by this {@link GestureHandlerGroup}
   *
   * @return {Element[]}
   */
  getElements: function() {
    return _.map(this.gestureHandlers, function(gestureHandler) {
      return gestureHandler.element;
    });
  },

  /**
   * Gets the bounding client rects for all the elements in this {@link GestureHandlerGroup}
   *
   * @return {Object[]}
   */
  getElementRects: function() {
    return _.map(this.getElements(), function(element) {
      return rect.normalize(element);
    });
  },

  /**
   * Updates the bounds for all the {@link GestureHandler}s in the {@link GestureHandlerGroup}.
   *
   * @return {undefined}
   */
  updateBounds: function() {
    var elementRects = this.getElementRects();
    var containerElementBounds = rect.normalize(this.containerElement);
    var allElementBounds = rect.unionAll(elementRects);

    _.each(this.gestureHandlers, function(gestureHandler, index) {
      var elementRect = elementRects[index];

      var bounds = rect.normalize({
        left: elementRect.left - (allElementBounds.width - containerElementBounds.width) - this.paddingRight,
        right: elementRect.right,
        top: elementRect.top - (allElementBounds.height - containerElementBounds.height) - this.paddingBottom,
        bottom: elementRect.bottom
      });

      // Disallow horizontal movement if the width of all elements is less than the width of the container
      if (allElementBounds.width < containerElementBounds.width) {
        bounds.left = elementRect.left;
      }

      // Disallow vertical movement if the height of all elements is less than the height of the container
      if (allElementBounds.height < containerElementBounds.height) {
        bounds.top = elementRect.top;
      }

      /*
      console.log("------------");
      console.log("element.id", gestureHandler.element.id);
      console.log("elementRect", elementRect);
      console.log("allElementBounds.width " + allElementBounds.width);
      console.log("containerElementBounds.width", containerElementBounds.width);
      console.log("bounds", bounds);
      */

      gestureHandler.setBounds(bounds);
    }, this);
  }

});

module.exports = GestureHandlerGroup;

},{"../events/binder":4,"../events/hasemitter":7,"../utils/rect":35,"../utils/validate":36,"./gesturehandler":22,"lodash":"lodash"}],24:[function(require,module,exports){
/**
 * Index module for decks ui modules.
 *
 * @module decks/ui
 */
module.exports = {
  /**
   * Provides access to the {@link decks/ui/dom} module.
   */
  dom: require("./dom"),

  /**
   * Provides access to the {@link GestureHandler} class.
   */
  GestureHandler: require("./gesturehandler"),

  /**
   * Provides access to the {@link GestureHandlerGroup} class.
   */
  GestureHandlerGroup: require("./gesturehandlergroup"),

  /**
   * Provides access to the {@link GestureEmitter} class.
   */
  GestureEmitter: require("./gestureemitter"),

  /**
   * Provides access to the {@link PanEmitter} class.
   */
  PanEmitter: require("./panemitter"),

  /**
   * Provides access to the {@link SwipeEmitter} class.
   */
  SwipeEmitter: require("./swipeemitter"),

  /**
   * Provides access to the {@link MouseWheelEmitter} class.
   */
  MouseWheelEmitter: require("./mousewheelemitter"),

  /**
   * Provides access to the {@link MouseOverOutEmitter} class.
   */
  MouseOverOutEmitter: require("./mouseoveroutemitter"),

  /**
   * Provides access to the {@link MouseEnterLeaveEmitter} class.
   */
  MouseEnterLeaveEmitter: require("./mouseenterleaveemitter"),

  /**
   * Provides access to the {@link TapEmitter} class.
   */
  TapEmitter: require("./tapemitter"),

  /**
   * Provides access to the {@link PressEmitter} class.
   */
  PressEmitter: require("./pressemitter"),

  /**
   * Provides access to the {@link ScrollEmitter} class.
   */
  ScrollEmitter: require("./scrollemitter")
};

},{"./dom":20,"./gestureemitter":21,"./gesturehandler":22,"./gesturehandlergroup":23,"./mouseenterleaveemitter":25,"./mouseoveroutemitter":26,"./mousewheelemitter":27,"./panemitter":28,"./pressemitter":29,"./scrollemitter":30,"./swipeemitter":31,"./tapemitter":32}],25:[function(require,module,exports){
var _ = require("lodash");
var GestureEmitter = require("./gestureemitter");
var DecksEvent = require("../events/decksevent");

/**
 * Class that emits or provides support for mouseover and mouseout events
 *
 * @class
 * @extends GestureEmitter
 * @param {!Object} options - Additional options
 * @param {?(Emitter|Object)} [options.emitter={}] - Emitter instance or options on which to emit events
 * @param {!Element} options.element - Element for which to bind events
 * @param {!Hammer} options.hammer - Hammer instance for the element (required by base class)
 * @param {?boolean} [options.enabled=false] - Whether to enable this emitter
 * @param {?boolean} [options.horizontal=false] - Whether to monitor horizontal pan gestures.
 * @param {?boolean} [options.vertical=true] - Whether to monitor vertical pan gestures.
 * @param {?number} [options.threshold=0] - Threshold distance before pan gestures are detected.
 */
function MouseEnterLeaveEmitter(options) {
  if (!(this instanceof MouseEnterLeaveEmitter)) {
    return new MouseEnterLeaveEmitter(options);
  }

  options = _.merge({}, this.defaultOptions, options);
  GestureEmitter.call(this, options);

  this.enter = !!options.enter;
  this.leave = !!options.leave;

  this.bind();
}

MouseEnterLeaveEmitter.prototype = _.create(GestureEmitter.prototype, /** @lends MouseEnterLeaveEmitter.prototype */ {
  constructor: MouseEnterLeaveEmitter,

  defaultOptions: _.merge({}, GestureEmitter.prototype.defaultOptions, {
    enter: true,
    out: true
  }),

  getElementEvents: function getElementEvents() {
    var map = {};
    if (this.enter) {
      map.mouseenter = "onMouseEnter";
    }
    if (this.leave) {
      map.mouseleave = "onMouseLeave";
    }
    return map;
  },

  onMouseEnter: function onMouseEnter(e) {
    this.emit(DecksEvent("gesture:mouse:enter", this, e));
  },

  onMouseLeave: function onMouseLeave(e) {
    this.emit(DecksEvent("gesture:mouse:leave", this, e));
  }
});

module.exports = MouseEnterLeaveEmitter;

},{"../events/decksevent":5,"./gestureemitter":21,"lodash":"lodash"}],26:[function(require,module,exports){
var _ = require("lodash");
var GestureEmitter = require("./gestureemitter");
var DecksEvent = require("../events/decksevent");

/**
 * Class that emits or provides support for mouseover and mouseout events on an element
 *
 * @class
 * @extends GestureEmitter
 * @param {!Object} options - Additional options
 * @param {?(Emitter|Object)} [options.emitter={}] - Emitter instance or options on which to emit events
 * @param {!Element} options.element - Element for which to bind events
 * @param {!Hammer} options.hammer - Hammer instance for the element (required by base class)
 * @param {?boolean} [options.enabled=false] - Whether to enable this emitter
 * @param {?boolean} [options.horizontal=false] - Whether to monitor horizontal pan gestures.
 * @param {?boolean} [options.vertical=true] - Whether to monitor vertical pan gestures.
 * @param {?number} [options.threshold=0] - Threshold distance before pan gestures are detected.
 */
function MouseOverOutEmitter(options) {
  if (!(this instanceof MouseOverOutEmitter)) {
    return new MouseOverOutEmitter(options);
  }

  options = _.merge({}, this.defaultOptions, options);
  GestureEmitter.call(this, options);

  this.over = !!options.over;
  this.out = !!options.out;

  this.bind();
}

MouseOverOutEmitter.prototype = _.create(GestureEmitter.prototype, /** @lends MouseOverOutEmitter.prototype */ {
  constructor: MouseOverOutEmitter,

  defaultOptions: _.merge({}, GestureEmitter.prototype.defaultOptions, {
    over: true,
    out: true
  }),

  getElementEvents: function getElementEvents() {
    var map = {};
    if (this.over) {
      map.mouseover = "onMouseOver";
    }
    if (this.out) {
      map.mouseout = "onMouseOut";
    }
    return map;
  },

  onMouseOver: function onMouseOver(e) {
    this.emit(DecksEvent("gesture:mouse:over", this, e));
  },

  onMouseOut: function onMouseOut(e) {
    this.emit(DecksEvent("gesture:mouse:out", this, e));
  }
});

module.exports = MouseOverOutEmitter;

},{"../events/decksevent":5,"./gestureemitter":21,"lodash":"lodash"}],27:[function(require,module,exports){
var _ = require("lodash");
var GestureEmitter = require("./gestureemitter");

/**
 * Class that emits or provides support for mouse wheel events/gestures.
 *
 * TODO: this class is not implemented (not functional)
 *
 * @class
 * @extends GestureEmitter
 * @param {!Object} options - Additional options
 * @param {?(Emitter|Object)} [options.emitter={}] - Emitter instance or options on which to emit events
 * @param {!Element} options.element - Element for which to bind events
 * @param {!Hammer} options.hammer - Hammer instance for the element (required by base class)
 * @param {?boolean} [options.enabled=false] - Whether to enable this emitter
 */
function MouseWheelEmitter(options) {
  if (!(this instanceof MouseWheelEmitter)) {
    return new MouseWheelEmitter(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  GestureEmitter.call(this, options);

  this.bind();
}

MouseWheelEmitter.prototype = _.create(GestureEmitter.prototype, /** @lends MouseWheelEmitter.prototype */ {
  constructor: MouseWheelEmitter,

  defaultOptions: _.merge({}, GestureEmitter.prototype.defaultOptions, {
  }),

  getElementEvents: function getElementEvents() {
    return {};
  },

  getHammerEvents: function getHammerEvents() {
    return {};
  }
});

module.exports = MouseWheelEmitter;

},{"./gestureemitter":21,"lodash":"lodash"}],28:[function(require,module,exports){
var _ = require("lodash");
var Hammer = require("hammerjs");
var GestureEmitter = require("./gestureemitter");
var DecksEvent = require("../events/decksevent");

/**
 * Class that emits or provides support for pan gestures/events.
 *
 * @class
 * @extends GestureEmitter
 * @param {!Object} options - Additional options
 * @param {?(Emitter|Object)} [options.emitter={}] - Emitter instance or options on which to emit events
 * @param {!Element} options.element - Element for which to bind events
 * @param {!Hammer} options.hammer - Hammer instance for the element (required by base class)
 * @param {?boolean} [options.enabled=false] - Whether to enable this emitter
 * @param {?boolean} [options.horizontal=false] - Whether to monitor horizontal pan gestures.
 * @param {?boolean} [options.vertical=true] - Whether to monitor vertical pan gestures.
 * @param {?number} [options.threshold=0] - Threshold distance before pan gestures are detected.
 */

function PanEmitter(options) {
  if (!(this instanceof PanEmitter)) {
    return new PanEmitter(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  GestureEmitter.call(this, options);

  /** Whether to emit events for horizontal pan gestures. */
  this.horizontal = !!options.horizontal;

  /** Whether to emit events for horizontal pan gestures. */
  this.vertical = !!options.vertical;

  /** Pixel distance before pan events are emitted. */
  this.threshold = options.threshold || 0;

  if (options.horizontal && options.vertical) {
    /** Hammer direction enum value to use. */
    this.direction = Hammer.DIRECTION_ALL;
  } else if (options.horizontal) {
    this.direction = Hammer.DIRECTION_HORIZONTAL;
  } else {
    this.direction = Hammer.DIRECTION_VERTICAL;
  }

  this.hammer.get("pan").set({
    direction: this.direction,
    threshold: this.threshold
  });

  this.bind();
}

PanEmitter.prototype = _.create(GestureEmitter.prototype, /** @lends PanEmitter.prototype */ {
  constructor: PanEmitter,

  /**
   * Default options hash for constructor.
   */
  defaultOptions: _.merge({}, GestureEmitter.prototype.defaultOptions, {
    horizontal: false,
    vertical: true,
    threshold: 0
  }),

  /**
   * Returns the map of Hammer.js events to which to bind.
   */
  getHammerEvents: function getHammerEvents() {
    var map = {
      "panstart": "onPanStart",
      "panend": "onPanEnd",
      "pancancel": "onPanCancel"
    };
    if (this.horizontal && this.vertical) {
      map.panmove = "onPanMove";
    } else if (this.horizontal) {
      map["panleft panright"] = "onPanX";
    } else if (this.vertical) {
      map["panup pandown"] = "onPanY";
    }
    return map;
  },

  onPanStart: function onPanStart(e) {
    /**
     * Event for a pan start.
     *
     * @event PanEmitter#gesture:pan:start
     * @type {DecksEvent}
     * @property {String} type - the event type string
     * @property {PanEmitter} sender - the sender of the event
     * @property {*} data - the hammer event object
     */
    this.emit(DecksEvent("gesture:pan:start", this, e));
  },

  /**
   * Called when a panmove event is detected by Hammer.js.
   *
   * @fires PanEmitter#gesture:pan:any
   *
   * @param e - Hammer event object
   * @returns {undefined}
   */
  onPanMove: function onPanMove(e) {
    // TODO: might want to emit pan:x and pan:y here too (if direction is applicable)

    /**
     * Event for a pan gesture in any direction.
     *
     * @event PanEmitter#gesture:pan:any
     * @type {DecksEvent}
     * @property {String} type - the event type string
     * @property {PanEmitter} sender - the sender of the event
     * @property {*} data - the hammer event object
     * @returns {undefined}
     */
    this.emit(DecksEvent("gesture:pan:any", this, e));
  },

  onPanX: function onPanX(e) {
    // TODO: might want to emit pan:any here too

    /**
     * Event for a pan gesture in the horizontal direction.
     *
     * @event PanEmitter#gesture:pan:x
     * @type {DecksEvent}
     * @property {String} type - the event type string
     * @property {PanEmitter} sender - the sender of the event
     * @property {*} data - the hammer event object
     */
    this.emit(DecksEvent("gesture:pan:x", this, e));
  },

  onPanY: function onPanY(e) {
    // TODO: might want to emit pan:any here too

    /**
     * Event for a pan gesture in the vertical direction.
     *
     * @event PanEmitter#gesture:pan:y
     * @type {DecksEvent}
     * @property {String} type - the event type string
     * @property {PanEmitter} sender - the sender of the event
     * @property {*} data - the hammer event object
     */
    this.emit(DecksEvent("gesture:pan:y", this, e));
  },

  onPanEnd: function onPanEnd(e) {
    /**
     * Event for a pan end.
     *
     * @event PanEmitter#gesture:pan:end
     * @type {DecksEvent}
     * @property {String} type - the event type string
     * @property {PanEmitter} sender - the sender of the event
     * @property {*} data - the hammer event object
     */
    this.emit(DecksEvent("gesture:pan:end", this, e));
  },

  onPanCancel: function onPanCancel(e) {
    /**
     * Event for a pan cancel.
     *
     * @event PanEmitter#gesture:pan:cancel
     * @type {DecksEvent}
     * @property {String} type - the event type string
     * @property {PanEmitter} sender - the sender of the event
     * @property {*} data - the hammer event object
     */
    this.emit(DecksEvent("gesture:pan:cancel", this, e));
  }
});

module.exports = PanEmitter;


},{"../events/decksevent":5,"./gestureemitter":21,"hammerjs":"hammerjs","lodash":"lodash"}],29:[function(require,module,exports){
var _ = require("lodash");
var GestureEmitter = require("./gestureemitter");
var DecksEvent = require("../events/decksevent");

/**
 * Gesture emitter that monitors a single element for press (long-touch/hold) events.
 *
 * @class
 * @extends GestureEmitter
 * @param {!Object} options - Additional options
 * @param {?(Emitter|Object)} [options.emitter={}] - Emitter instance or options on which to emit events
 * @param {!Element} options.element - Element for which to bind events
 * @param {!Hammer} options.hammer - Hammer instance for the element (required by base class)
 * @param {?boolean} [options.enabled=false] - Whether to enable this emitter
 */
function PressEmitter(options) {
  if (!(this instanceof PressEmitter)) {
    return new PressEmitter(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  GestureEmitter.call(this, options);

  this.threshold = options.threshold;
  this.time = options.time;

  this.hammer.get("press").set({
    threshold: this.threshold,
    time: this.time
  });

  this.bind();
}

PressEmitter.prototype = _.create(GestureEmitter.prototype, /** @lends PressEmitter.prototype */ {
  constructor: PressEmitter,

  /**
   * Default options
   */
  defaultOptions: _.merge({}, GestureEmitter.prototype.defaultOptions, {
    threshold: 5,
    time: 1000
  }),

  /**
   * Gets a map of hammer events to monitor for press-related gestures.
   */
  getHammerEvents: function getHammerEvents() {
    return {
      "press": "onPress"
    };
  },

  /**
   * Called when a Hammer.js press event occurs
   *
   * @param e - Hammer.js event Object
   * @fires PressEmitter#gesture:press
   */
  onPress: function onPress(e) {
    /**
     * Event for a press (long-touch/hold) gesture.
     *
     * @event PressEmitter#gesture:press
     * @type {DecksEvent}
     * @property {String} type - The event type string
     * @property {PressEmitter} sender - The PressEmitter instance sending the event.
     * @property {*} data - The Hammer.js press event object.
     */
    this.emit(DecksEvent("gesture:press", this, e));
  }
});

module.exports = PressEmitter;

},{"../events/decksevent":5,"./gestureemitter":21,"lodash":"lodash"}],30:[function(require,module,exports){
var _ = require("lodash");
var GestureEmitter = require("./gestureemitter");
var DecksEvent = require("../events/decksevent");

/**
 * Gesture emitter which monitors for Element scroll events, and re-emits
 * them on the {@link Emitter}.  Note that scroll events are fired on a scrollable
 * container, not an a scrollable element itself.
 *
 * @param {!Object} options - Additional options
 * @param {?(Emitter|Object)} [options.emitter={}] - Emitter instance or options on which to emit events
 * @param {!Element} options.element - Element for which to bind events
 * @param {!Hammer} options.hammer - Hammer instance for the element (required by base class)
 * @param {?boolean} [options.enabled=false] - Whether to enable this emitter
 * @return {ScrollEmitter}
 */
function ScrollEmitter(options) {
  if (!(this instanceof ScrollEmitter)) {
    return new ScrollEmitter(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  GestureEmitter.prototype.constructor.call(this, options);

  this.bind();
}

ScrollEmitter.prototype = _.create(GestureEmitter.prototype, /** @lends ScrollEmitter.prototype */ {
  constructor: ScrollEmitter,

  /**
   * Default options
   */
  defaultOptions: _.merge({}, GestureEmitter.prototype.defaultOptions, {
  }),

  getElementEvents: function getElementEvents() {
    return {
      "scroll": "onScroll"
    };
  },

  /**
   * Called when a scroll event occurs on the Element.
   *
   * Re-emits the scroll event as a {@link DecksEvent}.
   *
   * @param e
   * @return {undefined}
   */
  onScroll: function onScroll(e) {
    this.emit(DecksEvent("gesture:scroll", this, e));
  }
});

module.exports = ScrollEmitter;

},{"../events/decksevent":5,"./gestureemitter":21,"lodash":"lodash"}],31:[function(require,module,exports){
var _ = require("lodash");
var Hammer = require("hammerjs");
var GestureEmitter = require("./gestureemitter");
var DecksEvent = require("../events/decksevent");

/**
 * Class that emits or provides support for swipe gestures/events.
 *
 * @class
 * @extends GestureEmitter
 * @param {!Object} options - Additional options
 * @param {?(Emitter|Object)} [options.emitter={}] - Emitter instance or options on which to emit events
 * @param {!Element} options.element - Element for which to bind events
 * @param {!Hammer} options.hammer - Hammer instance for the element (required by base class)
 * @param {?boolean} [options.enabled=false] - Whether to enable this emitter
 * @param {?boolean} [options.horizontal=false] - Whether to detect horizontal swipes
 * @param {?boolean} [options.vertical=true] - Whether to detect vertical swipes
 * @param {?number} [options.threshold=0] - Movement distance (px) required before swipe is detected
 * @param {?number} [options.velocity=0.65] - Movement speed (px/ms) required before swipe is detected
 */
function SwipeEmitter(options) {
  if (!(this instanceof SwipeEmitter)) {
    return new SwipeEmitter(options);
  }

  options = _.merge({}, this.defaultOptions, options);
  GestureEmitter.call(this, options);

  /**
   * Whether to monitor horizontal swipes
   */
  this.horizontal = options.horizontal;

  /**
   * Whether to monitor vertical swipes
   */
  this.vertical = options.vertical;

  /**
   * Threshold movement before swipe gesture is recognized (px)
   */
  this.threshold = options.threshold;

  /**
   * Threshold velocity before swipe gesture is recognized (px/ms)
   */
  this.velocity = options.velocity;

  if (this.horizontal && this.vertical) {
    /**
     * Hammer.js direction enum value
     */
    this.direction = Hammer.DIRECTION_ALL;
  } else if (this.horizontal) {
    this.direction = Hammer.DIRECTION_HORIZONTAL;
  } else {
    this.direction = Hammer.DIRECTION_VERTICAL;
  }

  this.hammer.get("swipe").set({
    direction: this.direction,
    threshold: this.threshold,
    velocity: this.velocity
  });

  this.bind();
}

SwipeEmitter.prototype = _.create(GestureEmitter.prototype, /** @lends SwipeEmitter.prototype */ {
  constructor: SwipeEmitter,

  /**
   * Default options
   */
  defaultOptions: _.merge({}, GestureEmitter.prototype.defaultOptions, {
    /**
     * Whether to detect and emit events for horizontal swipes
     */
    horizontal: false,

    /**
     * Whether to detect and emit events for vertical swipes
     */
    vertical: true,

    /**
     * Minimum distance of movement (px) required before a swipe gesture is recognized.
     */
    threshold: 0,

    /**
     * Minimum velocity of movement (px/ms) required before a swipe gesture is recognized.
     */
    velocity: 0.65
  }),

  getHammerEvents: function getHammerEvents() {
    var map = { };

    if (this.horizontal && this.vertical) {
      map.swipe = "onSwipe";
    } else if (this.horizontal) {
      map["swipeleft swiperight"] = "onSwipeX";
    } else if (this.vertical) {
      map["swipeup swipedown"] = "onSwipeY";
    }

    return map;
  },

  onSwipe: function onSwipe(e) {
    /**
     * Event for a swipe in any direction
     *
     * @event SwipeEmitter#gesture:swipe:any
     * @type {DecksEvent}
     * @property type
     * @property sender
     * @property data
     */
    this.emit(DecksEvent("gesture:swipe:any", this, e));
  },

  onSwipeX: function onSwipeX(e) {
    /**
     * Event for a swipe in horizontal direction
     *
     * @event SwipeEmitter#gesture:swipe:x
     * @type {DecksEvent}
     * @property type
     * @property sender
     * @property data
     */
    this.emit(DecksEvent("gesture:swipe:x", this, e));
  },

  onSwipeY: function onSwipeY(e) {
    /**
     * Event for a swipe in vertical direction
     *
     * @event SwipeEmitter#gesture:swipe:y
     * @type {DecksEvent}
     * @property type
     * @property sender
     * @property data
     */
    this.emit(DecksEvent("gesture:swipe:y", this, e));
  }
});

module.exports = SwipeEmitter;

},{"../events/decksevent":5,"./gestureemitter":21,"hammerjs":"hammerjs","lodash":"lodash"}],32:[function(require,module,exports){
var _ = require("lodash");
var GestureEmitter = require("./gestureemitter");
var DecksEvent = require("../events/decksevent");

/**
 * Class that monitors an element for tap (click/touch) events/gestures.
 *
 * @class
 * @extends GestureEmitter
 * @param {!Object} options - Additional options
 * @param {?(Emitter|Object)} [options.emitter={}] - Emitter instance or options on which to emit events
 * @param {!Element} options.element - Element for which to bind events
 * @param {!Hammer} options.hammer - Hammer instance for the element (required by base class)
 * @param {?boolean} [options.enabled=false] - Whether to enable this emitter
 */
function TapEmitter(options) {
  if (!(this instanceof TapEmitter)) {
    return new TapEmitter(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  GestureEmitter.call(this, options);

  /**
   * Minimum taps required to recognize
   */
  this.taps = options.taps;

  /**
   * Max time in ms between multiple taps
   */
  this.interval = options.interval;

  /**
   * Max press time in ms
   */
  this.time = options.time;

  /**
   * Max movement allowed during tap
   */
  this.threshold = options.threshold;

  /**
   * Max position difference between multiple taps
   */
  this.posThreshold = options.posThreshold;

  this.hammer.get("tap").set({
    taps: this.taps,
    interval: this.interval,
    time: this.time,
    threshold: this.threshold,
    posThreshold: this.posThreshold
  });

  this.bind();
}

TapEmitter.prototype = _.create(GestureEmitter.prototype, /** @lends TapEmitter.prototype */ {
  constructor: TapEmitter,

  defaultOptions: _.merge({}, GestureEmitter.prototype.defaultOptions, {
    taps: 1,
    interval: 300,
    time: 250,
    threshold: 2,
    posThreshold: 10
  }),

  getHammerEvents: function getHammerEvents() {
    return {
      "tap": "onTap"
    };
  },

  onTap: function onTap(e) {
    /**
     * Event for a tap (click/touch) event
     *
     * @event TapEmitter#gesture:tap
     * @type {DecksEvent}
     * @property type
     * @property sender
     * @property data
     */
    this.emit(DecksEvent("gesture:tap", this, e));
  }
});

module.exports = TapEmitter;

},{"../events/decksevent":5,"./gestureemitter":21,"lodash":"lodash"}],33:[function(require,module,exports){
var _ = require("lodash");

module.exports = (function getBrowserInfo() {
  var userAgent = window.navigator.userAgent;
  var msieIndex = userAgent.indexOf("MSIE ");
  var tridentIndex = userAgent.indexOf("Trident/");

  var msieVersion = -1;
  if (msieIndex > 0) {
    msieVersion = _.parseInt(userAgent.substring(msieIndex + 5, userAgent.indexOf(".", msieIndex)));
  } else if (tridentIndex > 0) {
    var rvIndex = userAgent.indexOf("rv:");
    msieVersion = _.parseInt(userAgent.substring(rvIndex + 3, userAgent.indexOf(".", rvIndex)));
  }

  // TODO: this is not a very robust check
  var isMobile = !!window.cordova ||
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

  return {
    isMobile: isMobile,
    isDesktop: !isMobile,
    isIE: _.isNumber(msieVersion) && msieVersion >= 0,
    isIE8: msieVersion === 8,
    isIE9: msieVersion === 9,
    isIE10: msieVersion === 10,
    isIE11: msieVersion === 11,
    isIE8OrGreater: msieVersion >= 8,
    isIE9OrGreater: msieVersion >= 9,
    isIE10OrGreater: msieVersion >= 10,
    isIE11OrGreater: msieVersion >= 11
  };
}());


},{"lodash":"lodash"}],34:[function(require,module,exports){
/**
 * Index module for utility modules/classes/mixins/etc.
 *
 * @module decks/utils
 */
module.exports = {
  /**
   * Provides access to the {@link module:decks/utils/browser} module.
   */
  browser: require("./browser"),

  /**
   * Provides access to the {@link module:decks/utils/rect} module.
   */
  rect: require("./rect"),

  /**
   * Provides access to the {@link module:decks/utils/validate} module.
   */
  validate: require("./validate")
};

},{"./browser":33,"./rect":35,"./validate":36}],35:[function(require,module,exports){
var _ = require("lodash");
var validate = require("./validate");

/**
 * Utility module for dealing with rectangles.
 *
 * @module decks/utils/rect
 */
module.exports = {
  /**
   * Normalizes an object that has top, bottom, left, and right properties, to a plain
   * object with top, bottom, left, right, width, and height properties.
   *
   * @param {*} r object that has top, bottom, left, right properties.  If r is an Element, r will be the
   * result of r.getBoundingClientRect()
   * @return {undefined}
   */
  normalize: function normalize(r) {
    validate(r, "rect#normalize: r (rectangle object)", { isRequired: true });

    if (r.isNormalized) {
      return r;
    }

    if (_.isElement(r)) {
      r = this.getElementRect(r);
    }

    return {
      isNormalized: true,
      top: r.top,
      bottom: r.bottom,
      left: r.left,
      right: r.right,
      width: _.isNumber(r.width) ? r.width : (r.right - r.left),
      height: _.isNumber(r.height) ? r.height : (r.bottom - r.top)
    };
  },

  /**
   * Gets a bounding client rect for an element, with respect to the document coordinate
   * system (not the window coordinate system).
   *
   * @param {HTMLElement} element - the element for which to find the rect
   * @return {Object} - the calculated rect, with respect to the document coordinate system
   */
  getElementRect: function getElementRect(element) {
    validate(element, "rect#getElementRect: element", { isElement: true });
    return element.getBoundingClientRect();
  },

  /**
   * Indicates whether rectangle r1 intersects rectangle r2
   *
   * @param {*} r1 first rectangle
   * @param {*} r2 second rectangle
   * @return {boolean} true if r1 intersects r2, otherwise false
   */
  intersects: function intersects(r1, r2) {
    r1 = this.normalize(r1);
    r2 = this.normalize(r2);
    return !(r2.left > r1.right ||
      r2.right < r1.left ||
      r2.top > r1.bottom ||
      r2.bottom < r1.top);
  },

  /**
   * Returns a new rectangle which is the union of rectangles r1 and r2
   *
   * @param {*} r1 rectangle 1
   * @param {*} r2 rectangle 2
   * @return {*} New rectangle that is the union of r1 and r2
   */
  union: function union(r1, r2) {
    r1 = this.normalize(r1);
    r2 = this.normalize(r2);
    return this.normalize({
      top: Math.min(r1.top, r2.top),
      bottom: Math.max(r1.bottom, r2.bottom),
      left: Math.min(r1.left, r2.left),
      right: Math.max(r1.right, r2.right)
    });
  },

  /**
   * Indicates if two rects are equal in all dimensions/values.
   *
   * @param r1
   * @param r2
   * @return {undefined}
   */
  isEqual: function isEqual(r1, r2) {
    if (!r1 && !r2) {
      return true;
    }
    if (!r1 || !r2) {
      return false;
    }
    r1 = this.normalize(r1);
    r2 = this.normalize(r2);
    return _.isEqual(r1, r2);
  },

  /**
   * Returns a new rectangle which is the union of all the given rectangles
   *
   * @param {Array} rects
   * @return {*} New rectangle
   */
  unionAll: function unionAll(rects) {
    validate(rects, "rect#unionAll: rects", { isArray: true });

    // Initial accumulator allows the first rectangle to win the union
    var acc = {
      top: Infinity,
      bottom: -Infinity,
      left: Infinity,
      right: -Infinity
    };
    return _.reduce(rects, function(acc, rect) {
      return this.union(acc, rect);
    }, acc, this);
  },

  /**
   * Resizes a rect by adding the specified width and height values, and adjusting
   * the right and bottom dimensions, based on the current top/left and new width/height.
   *
   * Use negative width and height to shrink the rect.
   *
   * This does not change top and left.
   *
   * @param {!Object} r - rectangle-like object
   * @param {?number} [width=0] - delta value for width
   * @param {?number} [height=0] - delta value for height
   * @return {Object} resulting normalized rectangle object
   */
  resize: function resize(r, deltaWidth, deltaHeight) {
    r = this.normalize(r);
    deltaWidth = deltaWidth || 0;
    deltaHeight = deltaHeight || 0;
    return this.normalize({
      left: r.left,
      right: r.right + deltaWidth,
      top: r.top,
      bottom: r.bottom + deltaHeight,
      width: r.width + deltaWidth,
      height: r.height + deltaHeight
    });
  },

  /**
   * Resizes a rect with a delta width (changes width and right)
   *
   * @param r
   * @param deltaWidth
   * @return {undefined}
   */
  resizeWidth: function resizeWidth(r, deltaWidth) {
    return this.resize(r, deltaWidth, 0);
  },

  /**
   * Resizes a rect with a delta height (changes height and bottom)
   *
   * @param r
   * @param deltaHeight
   * @return {undefined}
   */
  resizeHeight: function resizeHeight(r, deltaHeight) {
    return this.resize(r, 0, deltaHeight);
  },

  /**
   * Resizes a rect to an absolute width and height (not delta values)
   *
   * @param r
   * @param width
   * @param height
   * @return {undefined}
   */
  resizeTo: function resizeTo(r, width, height) {
    r = this.normalize(r);
    width = width || r.width;
    height = height || r.height;
    return this.normalize({
      left: r.left,
      right: r.left + width,
      top: r.top,
      bottom: r.top + height,
      width: width,
      height: height
    });
  },

  /**
   * Resizes a rect to an absolute width (not delta value)
   *
   * @param r
   * @param width
   * @return {undefined}
   */
  resizeToWidth: function resizeToWidth(r, width) {
    return this.resizeTo(r, width, null);
  },

  /**
   * Resizes to rect to an absolute height (not delta value)
   *
   * @param r
   * @param height
   * @return {undefined}
   */
  resizeToHeight: function resizeToHeight(r, height) {
    return this.resizeTo(r, null, height);
  },

  /**
   * Moves a rect by adding the specified x and y values to left and top.
   *
   * The width and height are not changed, but the right and bottom values are changed based
   * on the new left/top and current width/height.
   *
   * This does not change width and height;
   *
   * @param {!Object} r - rectangle-like object
   * @param {?number} [x=0] - delta value for left
   * @param {?number} [y=0] - delta value for top
   * @return {Object} - resulting normalized rectangle object
   */
  move: function move(r, deltaX, deltaY) {
    r = this.normalize(r);
    deltaX = deltaX || 0;
    deltaY = deltaY || 0;
    return this.normalize({
      left: r.left + deltaX,
      right: r.right + deltaX,
      top: r.top + deltaY,
      bottom: r.bottom + deltaY,
      width: r.width,
      height: r.height
    });
  },

  /**
   * Moves a rect by a delta x value.
   *
   * @param r
   * @param deltaX
   * @return {undefined}
   */
  moveX: function moveX(r, deltaX) {
    return this.move(r, deltaX, 0);
  },

  /**
   * Moves a rect by a delta y value.
   *
   * @param r
   * @param deltaY
   * @return {undefined}
   */
  moveY: function moveY(r, deltaY) {
    return this.move(r, 0, deltaY);
  },

  /**
   * Moves a rect to an absolute x and y location.
   *
   * @param r
   * @param x
   * @param y
   * @return {undefined}
   */
  moveTo: function moveTo(r, x, y) {
    r = this.normalize(r);
    x = x || r.left;
    y = y || r.top;
    return this.normalize({
      left: x,
      right: x + r.width,
      top: y,
      bottom: y + r.height,
      width: r.width,
      height: r.height
    });
  },

  /**
   * Moves a rect to an absolute x location.
   *
   * @param r
   * @param x
   * @return {undefined}
   */
  moveToX: function moveToX(r, x) {
    return this.moveTo(r, x, null);
  },

  /**
   * Moves a rect to an absolute y location.
   *
   * @param r
   * @param y
   * @return {undefined}
   */
  moveToY: function moveToY(r, y) {
    return this.moveTo(r, null, y);
  },

  /**
   * Calculates the distance between two points.  Points can be expressed with top and left values,
   * or x and y values.
   *
   * @param {!Object} point1 - first point
   * @param {!Object} point2 - second point
   * @return {number} - the distance between the points
   */
  distance: function distance(point1, point2) {
    var x1 = point1.left || point1.x || 0;
    var y1 = point1.top || point1.y || 0;
    var x2 = point2.left || point2.x || 0;
    var y2 = point2.top || point2.y || 0;
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }
};

},{"./validate":36,"lodash":"lodash"}],36:[function(require,module,exports){
var _ = require("lodash");

function isNullOrUndefined(obj) {
  return _.isNull(obj) || _.isUndefined(obj);
}

function validate(obj, name, constraints) {
  if (!validate.isEnabled) {
    return;
  }

  constraints = constraints || {};

  if (constraints.isRequired && isNullOrUndefined(obj)) {
    throw new Error(name + " is required");
  }

  if (constraints.isPlainObject && !_.isPlainObject(obj)) {
    throw new Error(name + " must be a plain object");
  }

  if (constraints.isArray && !_.isArray(obj)) {
    throw new Error(name + " must be an array");
  }

  if (constraints.isString && !_.isString(obj)) {
    throw new Error(name + " must be a string");
  }

  if (constraints.isFunction && !_.isFunction(obj)) {
    throw new Error(name + " must be a function");
  }

  if (constraints.isNumber && !_.isNumber(obj)) {
    throw new Error(name + " must be a number");
  }

  if (constraints.isFinite && !_.isFinite(obj)) {
    throw new Error(name + " must be a finite number");
  }

  if (constraints.isRegExp && !_.isRegExp(obj)) {
    throw new Error(name + " must be a regular expression");
  }

  if (constraints.isElement && !_.isElement(obj)) {
    throw new Error(name + " must be an element");
  }

  if (constraints.isInstanceOf && !(obj instanceof constraints.isInstanceOf)) {
    throw new Error(name + " must be an instance of " + constraints.isInstanceOf);
  }

  if (constraints.isArguments && !_.isArguments(obj)) {
    throw new Error(name + " must be an arguments object");
  }

  if (_.has(constraints, "isNotSet") && !isNullOrUndefined(constraints.isNotSet)) {
    throw new Error(name + " is already set");
  }
}

validate.isEnabled = true;

module.exports = validate;

},{"lodash":"lodash"}],37:[function(require,module,exports){
var _ = require("lodash");
var binder = require("./events").binder;
var hasEmitter = require("./events").hasEmitter;
var DecksEvent = require("./events").DecksEvent;
var dom = require("./ui").dom;
var ItemCollection = require("./itemcollection");
var Item = require("./item");
var Layout = require("./layout");
var Frame = require("./frame");
var Canvas = require("./canvas");
var validate = require("./utils/validate");
var raf = require("raf");
var GestureHandler = require("./ui/gesturehandler");
var GestureHandlerGroup = require("./ui/gesturehandlergroup");

/**
 * Viewport - manages visual (DOM) components
 *
 * @class
 * @mixes binder
 * @mixes hasEmitter
 * @param {!Object} options - options for viewport initialization
 * @param {!Object} options.animator - Animator object
 * @param {!Object} options.config - Configuration object
 * @param {!(Emitter|Object)} options.emitter - Emitter instance or options object
 * @param {!ItemCollection} options.itemCollection - ItemCollection instance
 * @param {!Layout} options.layout - Layout instance
 * @param {!Frame} options.frame - Frame instance
 * @param {!Canvas} options.canvas - Canvas instance
 */
function Viewport(options) {
  if (!(this instanceof Viewport)) {
    return new Viewport(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  /** Wait time for debounced onGestureElementMoved */
  this.debounedOnGestureElementMovedWait = options.debouncedOnGestureElementMovedWait;

  /** Whether to run a draw cycle when the deck:ready event is handled */
  this.drawOnDeckReady = options.drawOnDeckReady;

  /** Whether to use animation slots */
  this.useAnimationSlots = options.useAnimationSlots;

  /** Number of items to animate per animation slot */
  this.itemsPerRenderSlot = options.itemsPerRenderSlot;

  /** Max number of animation slots that will be animated in one animation cycle.  */
  this.maxSlotsWithAnimations = options.maxSlotsWithAnimations;

  /** Delay value for each successive animation slot */
  this.slotRenderDelay = options.slotRenderDelay;

  /** Debounced version of {@link Viewport#onGestureElementMoved} */
  this.debouncedOnGestureElementMoved = _.debounce(this.onGestureElementMoved, this.debouncedOnGestureElementMovedWait);

  /**
   * Data structure for storing the items and corresponding renders
   *
   * The data structure is a 2-level tree.  At the first level, the key is the item.id.
   * The value at the first level is an object with render.ids as keys.  The value At
   * the second level is the render object, e.g.
   *
   * @example Internal Viewport renders data structure
   * {
   *   // Item 1
   *   "item-id-1": {
   *     // Render "0" for Item 1
   *     "0": {
   *       "id": "0",
   *       "index": 0,
   *       "transform": {
   *         "top": 120,
   *         "left": 140
   *         ...
   *       },
   *       "animateOptions": {
   *         ...
   *       }
   *     },
   *     // Render "1" for Item 1
   *     "1": {
   *       "id": "1",
   *       "index": 1,
   *       "transform": {
   *         "top": 120,
   *         "left": 140
   *         ...
   *       },
   *       "animateOptions": {
   *         ...
   *       }
   *     }
   *   },
   *   // Item 2
   *   "item-id-2": {
   *     // Render "0" for Item 2
   *     "0": {
   *       "id": "0",
   *       "index": 1,
   *       "transform": ...
   *     }
   *   }
   * }
   */
  this.renders = {};

  /**
   * Keyed object of custom render objects.  The key is the custom Render id.
   *
   * A custom render is an object with an element/transform/etc., which is drawn on the
   * {@link Canvas}, but is not associated with an {@link Item} in the {@link ItemCollection}.
   *
   * This might be a custom divider line, label, etc.
   *
   * @example Internal Viewport custom renders data structure
   * {
   *   "0": {
   *     element: ...,
   *     transform: {
   *       ...
   *     },
   *     animateOptions: {
   *       ...
   *     },
   *     someOtherProperty: {
   *       ...
   *     }
   *   }
   * }
   */
  this.customRenders = {};

  /** Keeps track of how many renders are currently being drawn */
  this.renderAnimationCount = 0;

  /** Keeps track of the number of custom renders being drawn */
  this.customRenderAnimationCount = 0;

  /** Keeps track of {@link GestureHandlerGroup}s */
  this.gestureHandlerGroups = {};

  /** Whether to stop animations when a new cycle starts while one is already running */
  this.useAnimationStopping = options.useAnimationStopping;

  /**
   * Flag that indicates if the deck is ready.  Drawing actions are suppressed
   * until the deck is signaled as ready
   */
  this.isDeckReady = false;

  /** Whether drawing is enabled */
  this.isDrawingEnabled = options.isDrawingEnabled;

  /**
   * Object of properties to pass to all {@link Layout} methods invoked by the {@link Viewport}
   * This is to provide the {@link Layout} methods with more context for their logic.
   */
  this.layoutMethodOptions = {
    viewport: this
  };

  this.setAnimator(options.animator);
  this.setConfig(options.config);
  this.setEmitter(options.emitter);
  this.setDeck(options.deck);
  this.setItemCollection(options.itemCollection);
  this.setLayout(options.layout);
  this.setFrame(options.frame);
  this.setCanvas(options.canvas);

  this.layoutMethodOptions.emitter = this.emitter;

  // Optionally use animation slots for drawing renders (better performance at the expense of number
  // of animations allowed.
  if (this.useAnimationSlots) {
    if (this.config.debugDrawing) {
      console.log("Viewport#constructor: using animation slots");
    }
    this.drawRender = this.drawRenderWithAnimationSlots;
  }

  this.bind();

  this.emit(DecksEvent("viewport:ready", this));
}

_.extend(Viewport.prototype, binder, hasEmitter, /** @lends Viewport.prototype */ {
  /**
   * Default options for instances of Viewport
   */
  defaultOptions: {
    /** Whether to run a draw cycle on deck:ready */
    drawOnDeckReady: true,

    /** Whether drawing is enabled */
    isDrawingEnabled: true,

    /** Whether to stop animations when a draw cycle happens while another cycle is running */
    useAnimationStopping: false,

    /** Whether to forcefully run animations in small, staggered slots */
    useAnimationSlots: false,

    /** Number of items created and animated in each rendering slot */
    itemsPerRenderSlot: 15,

    /* animations are applied for total items = itemsPerRenderSlot * maxSlotsWithAnimations */
    maxSlotsWithAnimations: 3,

    /* delay between each render slot */
    slotRenderDelay: 100
  },

  /**
   * Event to method mapping for binding to the decks emitter.
   */
  getEmitterEvents: function getEmitterEvents() {
    return {
      // Deck
      "deck:ready": "onDeckReady",
      "deck:draw": "onDeckDraw",
      "deck:layout:setting": "onDeckLayoutSetting",
      "deck:layout:set": "onDeckLayoutSet",

      // Frame
      "frame:bounds:setting": "onFrameBoundsSetting",
      "frame:bounds:set": "onFrameBoundsSet",

      // Item
      "item:changed": "onItemChanged",
      "item:index:changed": "onItemIndexChanged",

      // ItemCollection
      "item:collection:item:adding": "onItemCollectionItemAdding",
      "item:collection:item:added": "onItemCollectionItemAdded",
      "item:collection:items:adding": "onItemCollectionItemsAdding",
      "item:collection:items:added": "onItemCollectionItemsAdded",
      "item:collection:item:removing": "onItemCollectionItemRemoving",
      "item:collection:item:removed": "onItemCollectionItemRemoved",
      "item:collection:clearing": "onItemCollectionClearing",
      "item:collection:cleared": "onItemCollectionCleared",
      "item:collection:filter:setting": "onItemCollectionFilterSetting",
      "item:collection:filter:set": "onItemCollectionFilterSet",
      "item:collection:sort:by:setting": "onItemCollectionSortBySetting",
      "item:collection:sort:by:set": "onItemCollectionSortBySet",
      "item:collection:reversed:setting": "onItemCollectionReversedSetting",
      "item:collection:reversed:set": "onItemCollectionReversedSet",
      "item:collection:indexing": "onItemCollectionIndexing",
      "item:collection:indexed": "onItemCollectionIndexed",

      // Gestures
      "gesture:element:moved": "debouncedOnGestureElementMoved"
    };
  },

  /**
   * Binds all {@link Viewport} event handlers
   *
   * @return {undefined}
   */
  bind: function bind() {
    this.bindEvents(this.emitter, this.getEmitterEvents());
  },

  /**
   * Unbinds all {@link Viewport} event handlers
   *
   * @return {undefined}
   */
  unbind: function unbind() {
    this.unbindEvents(this.emitter, this.getEmitterEvents());
  },

  /**
   * Binds all {@link GestureHandlerGroup}s managed by the {@link Viewport}
   *
   * @return {undefined}
   */
  bindGestures: function bindGestures() {
    if (this.gestureHandlerGroups) {
      _.each(this.gestureHandlerGroups, function(gestureHandlerGroup) {
        gestureHandlerGroup.bind();
      }, this);
    }
  },

  /**
   * Unbinds all {@link GestureHandlerGroup}s managed by the {@link Viewport}
   *
   * @return {undefined}
   */
  unbindGestures: function bindGestures() {
    if (this.gestureHandlerGroups) {
      _.each(this.gestureHandlerGroups, function(gestureHandlerGroup) {
        gestureHandlerGroup.unbind();
      }, this);
    }
  },

  /**
   * Destroys the {@link Viewport}
   *
   * @return {undefined}
   */
  destroy: function destroy() {
    this.unbind();

    if (this.gestureHandlerGroups) {
      _.each(this.gestureHandlerGroups, function(gestureHandlerGroup) {
        gestureHandlerGroup.destroy();
      }, this);
    }
  },

  /**
   * Sets the animator instance
   *
   * @param animator
   * @return {undefined}
   */
  setAnimator: function setAnimator(animator) {
    validate(animator, "animator", { isPlainObject: true, isNotSet: this.animate });
    this.animator = this.layoutMethodOptions.animator = animator;
  },

  /**
   * Sets the configuration object
   *
   * @param config
   * @return {undefined}
   */
  setConfig: function setConfig(config) {
    validate(config, "config", { isPlainObject: true, isNotSet: this.config });
    this.config = this.layoutMethodOptions.config = config;
  },

  /**
   * Sets the deck instance.
   *
   * @param deck
   * @return {undefined}
   */
  setDeck: function setDeck(deck) {
    validate(deck, "Viewport#setDeck: deck", { isRequired: true });
    this.deck = this.layoutMethodOptions.deck = deck;
  },

  /**
   * Sets the {@link ItemCollection} instance
   *
   * @param itemCollection
   * @return {undefined}
   */
  setItemCollection: function setItemCollection(itemCollection) {
    validate(itemCollection, "itemCollection", { isInstanceOf: ItemCollection, isNotSet: this.itemCollection });
    this.itemCollection = this.layoutMethodOptions.itemCollection = itemCollection;
  },

  /**
   * Sets the {@link Layout} instance
   *
   * @param layout
   * @return {undefined}
   */
  setLayout: function setLayout(layout) {
    validate(layout, "layout", { isInstanceOf: Layout });
    this.layout = this.layoutMethodOptions.layout = layout;
  },

  /**
   * Sets the {@link Frame} instance
   *
   * @param frame
   * @return {undefined}
   */
  setFrame: function setFrame(frame) {
    validate(frame, "frame", { isInstanceOf: Frame, isNotSet: this.frame });
    this.frame = this.layoutMethodOptions.frame = frame;
  },

  /**
   * Sets the {@link Canvas} instance
   *
   * @param canvas
   * @return {undefined}
   */
  setCanvas: function setCanvas(canvas) {
    validate(canvas, "canvas", { isInstanceOf: Canvas, isNotSet: this.canvas });
    this.canvas = this.layoutMethodOptions.canvas = canvas;
  },

  /**
   * Indicates whether the {@link Viewport} can draw.  This check is based on the isDeckReady flag,
   * the isDrawingEnabled flag, and possibly other conditions.
   *
   * @param {boolean} [canDrawCondition=undefined] - extra condition to check
   * @return {boolean} - true if drawing can be done, otherwise false
   */
  canDraw: function canDraw(canDrawCondition) {
    canDrawCondition = _.isBoolean(canDrawCondition) ? canDrawCondition : true;

    if (!canDrawCondition) {
      if (this.config.debugDrawing) {
        console.warn("Viewport#canDraw: not drawing - can draw condition is false");
      }
      return false;
    }

    if (!this.isDeckReady) {
      if (this.config.debugDrawing) {
        console.warn("Viewport#canDraw: not drawing - deck is not ready");
      }
      return false;
    }

    if (!this.isDrawingEnabled) {
      if (this.config.debugDrawing) {
        console.warn("Viewport#canDraw: not drawing - drawing is disabled");
      }
      return false;
    }

    return true;
  },

  /**
   * Enables drawing
   *
   * @return {undefined}
   */
  enableDrawing: function enableDrawing() {
    if (this.config.debugDrawing) {
      console.log("Viewport#enableDrawing: enabling drawing");
    }

    this.isDrawingEnabled = true;
  },

  /**
   * Disables drawing
   *
   * @return {undefined}
   */
  disableDrawing: function disableDrawing() {
    if (this.config.debugDrawing) {
      console.log("Viewport#disableDrawing: disabling drawing");
    }

    this.isDrawingEnabled = false;
  },

  /**
   * Starts the drawing (animation) process for an {@link Item}.
   *
   * 1. Get one or more "render" objects from the {@link Layout} for the {@link Item}.  A "render" is
   * an object that specifies where to place an item in the canvas, along with animation
   * options to animate the positioning/transform/delay/druation/etc.  A Layout can provide zero, one,
   * or more renders for an single {@link Item}, if the {@link Item} needs to be displayed multiple times within
   * the {@link Canvas} (e.g. if one {@link Item} should have multiple visual representations on the screen).
   *
   * 2. Initiate the async draw (animation) process for each render.
   *
   * @param {!Item} item item to draw
   * @param {?Object} options - additional options for drawing
   * @param {boolean} options.isLoadNeeded - indicates if the item should be re-loaded after the animation completes.
   * @return {undefined}
   */
  drawItem: function drawItem(item, options) {
    if (this.config.debugDrawing) {
      console.log("Viewport#drawItem: drawing item", item, options);
    }

    validate(item, "item", { isInstanceOf: Item });

    this.emit(DecksEvent("viewport:item:drawing", this, item));

    var layoutRenders = this.layout.getRenders(item, this.layoutMethodOptions);

    if (_.isNull(layoutRenders) || _.isUndefined(layoutRenders)) {
      layoutRenders = [];
    } else if (!_.isArray(layoutRenders)) {
      layoutRenders = [layoutRenders];
    }

    var renders = {};

    _.each(layoutRenders, function(render, index) {
      // Assign ids to each render (based on the array index), and change it from an array to
      // an object with the render id as the key, and the render as the value.  Also, add some additional
      // data to the render, like the item.
      render.id = "" + index;
      render.index = index;
      render.item = item;
      if (options) {
        render.isLoadNeeded = !!options.isLoadNeeded;
      }

      renders[render.id] = render;
    });

    this.drawRenders(item, renders);
  },

  /**
   * Starts the drawing process for all Items in the ItemCollection.
   *
   * @return {undefined}
   */
  drawItems: function drawItems(options) {
    if (this.config.debugDrawing) {
      console.log("Viewport#drawItems: drawing items", options);
    }

    var items = this.itemCollection.getItems();

    if (items.length === 0) {
      return;
    }

    this.emit(DecksEvent("viewport:items:drawing", this, items));

    _.each(items, function(item) {
      this.drawItem(item, options);
    }, this);
  },

  /**
   * Starts the erasing process for an Item.  All of the renders for the Item will
   * be "erased" (removed from the DOM), possibly with an removal animation.  Once
   * each render is "erased" the actual render object is removed from the renders data
   * structure.  Once all of the Item's renders are removed, the item itself will be
   * removed from the renders data structure.
   *
   * @param {Item} item item for which to remove renders
   * @return {undefined}
   */
  eraseItem: function eraseItem(item) {
    if (this.config.debugDrawing) {
      console.log("Viewport#eraseItem: erasing item", item);
    }

    validate(item, "item", { isInstanceOf: Item });

    this.emit(DecksEvent("viewport:item:erasing", this, item));

    item.isErasing = true;

    this.eraseRenders(item);
  },

  /**
   * Starts the erasing process for all the Items in the ItemCollection.
   *
   * @return {undefined}
   */
  eraseItems: function eraseItems(items) {
    items = _.isArray(items) ? items : this.itemCollection.getItems();

    if (this.config.debugDrawing) {
      console.log("Viewport#eraseItem: erasing items", items);
    }

    if (items.length === 0) {
      return;
    }

    this.emit(DecksEvent("viewport:items:erasing", this, items));

    _.each(items, function(item) {
      this.eraseItem(item);
    }, this);
  },

  /**
   * Removes an item from the internal items/renders data structure.  This is called
   * automatically after eraseItem, once all the renders have been erased and removed.
   * This should not be called directly.
   *
   * @param {!Item} item Item to remove
   * @return {undefined}
   */
  removeItem: function removeItem(item) {
    if (this.config.debugDrawing) {
      console.log("Viewport#removeItem: removing items", item);
    }

    validate(item, "item", { isInstanceOf: Item });

    delete this.renders[item.id];

    this.emit(DecksEvent("viewport:item:erased", this, item));
  },

  /**
   * Gets the renders object for the given Item.
   *
   * This returns the renders currently stored in the Viewport instance,
   * it does not request new renders from the Layout.
   *
   * @param {?Item} item item for which to get renders, or if not specified, get all renders
   * @return {Object[]} array of renders for the given item
   */
  getRenders: function getRenders(item) {
    // If no item specified, return all current renders
    if (!item) {
      return _(this.renders) // object with item ids as keys, with values of objects with render ids as keys
        .map(_.values) // array of objects that have render ids as keys
        .map(_.values) // array of arrays of render objects
        .flatten() // array of render objects
        .value();
    }

    validate(item, "item", { isInstanceOf: Item });

    if (!this.renders[item.id]) {
      this.renders[item.id] = {};
    }

    return this.renders[item.id];
  },

  /**
   * Gets a single render object for an {@link Item}.
   *
   * @param {!Item} item - Item for which t o get render
   * @param {!(String|Number)} [renderIdOrIndex=0] - render id or index
   * @return {Object} - the render object (if exists)
   */
  getRender: function getRender(item, renderIdOrIndex) {
    validate(item, "item", { isInstanceOf: Item });

    var renderId = "" + (renderIdOrIndex || 0);

    return this.getRenders(item)[renderId];
  },

  /**
   * Checks if an Item currently has any renders stored in the Viewport items/renders
   * data structure.
   *
   * @param {?Item} item - Item for which to check for the existence of renders (or undefined to see if any renders exist)
   * @return {boolean} true if the Item has renders, otherwise false
   */
  hasRenders: function hasRenders(item) {
    return !_.isEmpty(this.getRenders(item));
  },

  /**
   * Stores the given render object in the Viewports internal items/renders data structure.
   *
   * This is called automatically after a render has been drawn (after the animation completes).
   * This should not be called directly.
   *
   * @param {!Object} render render to store
   * @return {undefined}
   */
  setRender: function setRender(render) {
    if (this.config.debugDrawing) {
      console.log("Viewport#setRender: setting render", render);
    }

    validate(render, "render", { isRequired: true });

    var renders = this.getRenders(render.item);

    renders[render.id] = render;
  },

  /**
   * Starts the drawing process for a render.
   *
   * A render is an object which contains a DOM element - the render "container" element,
   * a "transform" - a hash of CSS properties and values to animate/set, and an "animateOptions"
   * which is a hash of animation properties, like duration, easing, etc.  A render is drawn
   * by executing the transform on the element, using a compatible animation function like
   * VelocityJS.  The drawing/animation process is asynchronous - this method starts the process,
   * and callbacks are used to track completion of the animation.
   *
   * @param {!Object} options animation options
   * @param {!Object} options.render render object
   * @param {!HTMLElement} options.render.element render element
   * @param {!Object} options.render.transform hash of CSS style properties to animate
   * @param {!Object} options.render.animateOptions animation options
   * @return {undefined}
   */
  drawRender: function drawRender(render) {
    var self = this;
    validate(render, "render", { isRequired: true });
    validate(render.element, "render.element", { isElement: true });

    this.setRender(render);

    self.setDefaultRenderAnimateOptions(render);

    if (render.isAnimating) {
      this.stopRenderAnimation(render);
    }

    render.isAnimating = true;
    self.renderAnimationCount++;

    if (self.config.debugDrawing) {
      console.log("Viewport#drawRender: drawing render (" + self.renderAnimationCount + ")", render);
    }

    raf(function() {
      var eventName = render.isErasing ? "viewport:render:erasing" : "viewport:render:drawing";
      self.emit(DecksEvent(eventName, self, render));

      raf(function() {
        self.animator.animate({
          elements: render.element,
          properties: render.transform,
          options: render.animateOptions
        });
      });
    });
  },

  /**
   * Alternate version of drawRender which forcibly slots out the animations, disables animations
   * after a certain threshold, and staggers small groups of them to gain better animation performance.
   */
  drawRenderWithAnimationSlots: function drawRenderWithAnimationSlots(render) {
    var self = this;
    validate(render, "render", { isRequired: true });
    validate(render.element, "render.element", { isElement: true });

    this.setRender(render);

    self.setDefaultRenderAnimateOptions(render);

    // stagger the element creation and animation into batches
    var renderSlotIndex = parseInt(self.renderAnimationCount / this.itemsPerRenderSlot, 10);
    var slotRenderDelay = this.slotRenderDelay;

    // Disable animation if the item falls in later slots
    if (renderSlotIndex >= this.maxSlotsWithAnimations ||
        render.animateOptions.display && render.animateOptions.display === "none") {
      // disable animation
      render.animateOptions.duration = 0;

      // cut the slot render delay by half when there are no animations
      slotRenderDelay = parseInt(slotRenderDelay / 2, 10);
    }

    // Stop any previous animations for this element
    if (render.isAnimating) {
      this.stopRenderAnimation(render);
    }

    render.isAnimating = true;
    self.renderAnimationCount++;

    if (self.config.debugDrawing) {
      console.log("Viewport#drawRender: drawing render (" + self.renderAnimationCount + ")", render);
    }

    _.delay(function () {
      raf(function() {
        var eventName = render.isErasing ? "viewport:render:erasing" : "viewport:render:drawing";
        self.emit(DecksEvent(eventName, self, render));

        raf(function() {
          self.animator.animate({
            elements: render.element,
            properties: render.transform,
            options: render.animateOptions
          });
        });
      });
    }, renderSlotIndex * slotRenderDelay /* stagger item creation and animation */);
  },

  /**
   * Draws the specified renders for the given Item.
   *
   * The Layout getRenders method does not specify an element in the render object, because the Layout
   * has no knowledge of elements - it merely provides the transform and animateOptions that it wants to
   * apply the the element(s) for an Item.  The Viewport keeps track of the Items and renders in a tree data
   * structure.  When new renders are retrieved from teh Layout, this method will merge the new renders
   * with any existing renders, add new elements where needed, and mark other elements for removal, and applies
   * the new render transforms for any existing elements.
   *
   * @param {!Item} item Item for which to draw renders
   * @param {!Object} renders keyed object of renders to draw for the item
   * @return {undefined}
   */
  drawRenders: function drawRenders(item, renders) {
    validate(item, "item", { isInstanceOf: Item });
    validate(renders, "renders", { isPlainObject: true });

    var newRenderIds = _.keys(renders);
    var previousRenders = this.getRenders(item);
    var previousRenderIds = _.keys(previousRenders);
    var renderIdsToMerge = _.intersection(previousRenderIds, newRenderIds); // renders that existed before, and exist in new set
    var renderIdsToRemove = _.difference(previousRenderIds, renderIdsToMerge); // renders that existed before, but don't exist in new set
    var renderIdsToAdd = _.difference(newRenderIds, renderIdsToMerge); // renders that did not exist before, but exist in new set

    if (this.config.debugDrawing) {
      console.log("Viewport#drawRenders: drawing renders for item", JSON.stringify({
        item: item.id,
        previousRenderIds: previousRenderIds,
        newRenderIds: newRenderIds,
        renderIdsToMerge: renderIdsToMerge,
        renderIdsToRemove: renderIdsToRemove,
        renderIdsToAdd: renderIdsToAdd
      }));
    }

    _.each(renderIdsToMerge, function(renderId) {
      var previousRender = previousRenders[renderId];
      var newRender = renders[renderId];
      var mergedRender = _.merge({}, previousRender, newRender);

      // If the transform is the same for the render, don't actually do the animation,
      // but fake it as if it happened, so we can still rely on the normal render cycle
      // completion logic (like detecting when all items have been processed, even if none
      // of them have changed.
      if (_.isEqual(previousRender.transform, mergedRender.transform) && !mergedRender.isLoadNeeded) {
        if (this.config.debugDrawing) {
          console.warn("Viewport#drawRenders: not animating item render (no change to transform)", item, mergedRender);
        }
        mergedRender.immediateCompleteAnimation = true;
      }

      this.drawRender(mergedRender);
    }, this);

    _.each(renderIdsToAdd, function(renderId) {
      var newRender = renders[renderId];
      newRender.element = this.createRenderElement(item, newRender);
      this.initializeRender(newRender);
      this.drawRender(newRender);
    }, this);

    _.each(renderIdsToRemove, function(renderId) {
      var previousRender = previousRenders[renderId];
      this.eraseRender(previousRender);
    }, this);
  },

  /**
   * Starts the erasing process for a render.  The erasing or hiding of a render is animated, and the actual
   * removal of the render is done after the animation completes.
   *
   * @param {!Object} render render to remove
   * @param {?Object} options additional options
   * @return {undefined}
   */
  eraseRender: function eraseRender(render) {
    if (this.config.debugDrawing) {
      console.log("Viewport#eraseRender: erasing render", render);
    }

    validate(render, "render", { isRequired: true });

    render.isErasing = true;

    this.layout.setHideAnimation(render, this.layoutMethodOptions);

    this.drawRender(render);
  },

  /**
   * Removes all the renders for an item, or all renders if no item is specified
   *
   * @param {?Item} item - item from which to remove all renders, or undefined to remove all renders
   * @param {?Number} index index of item, if known
   * @param {?Object} options additional options
   * @return {undefined}
   */
  eraseRenders: function eraseRenders(item) {
    var renders = this.getRenders(item);

    if (this.config.debugDrawing) {
      console.log("Viewport#eraseRenders: erasing renders", renders);
    }

    _.each(renders, function(render) {
      this.eraseRender(render);
    }, this);
  },

  /**
   * Removes the given render from the Viewport's internal items/renders data structure.
   *
   * This is called automatically after a render has been erased (after the erase animation).
   * This should not be called directly.
   *
   * @param {!Object} render render to remove
   * @return {undefined}
   */
  removeRender: function removeRender(render) {
    validate(render, "render", { isRequired: true });

    if (this.config.debugDrawing) {
      console.log("Viewport#removeRender: removing render", render);
    }

    var renders = this.getRenders(render.item);
    delete renders[render.id];

    this.emit(DecksEvent("viewport:render:erased", this, render));
  },

  /**
   * Gets the default animation options, extended with the options.render.animateOptions
   *
   * @param {!Object} options object to pass to callback methods, like complete
   * @return {Object} hash of animation options
   */
  setDefaultRenderAnimateOptions: function setDefaultRenderAnimateOptions(render) {
    var self = this;

    validate(render, "render", { isRequired: true });

    render.animateOptions.complete = function() {
      self.onRenderAnimationComplete(render);
    };

    if (render.immediateCompleteAnimation) {
      render.immediateCompleteAnimation = false;
      render.animateOptions.duration = 0;
    }
  },

  /**
   * Creates a container element for an individual render
   *
   * @return {HTMLElement} detached DOM element which will become the container for a render element.
   */
  createRenderElement: function createRenderElement(item, render) {
    validate(item, "item", { isInstanceOf: Item });
    validate(render, "render", { isRequired: true });

    if (this.config.debugDrawing) {
      console.log("Viewport#createRenderElement: creating element for render", render);
    }

    var element = dom.create("div");
    element.id = this.config.itemClassName + "-" + item.id + "-" + render.id;
    dom.addClass(element, this.config.itemClassName);
    dom.setStyle(element, "position", "absolute");
    dom.setStyle(element, "top", 0);
    dom.setStyle(element, "left", 0);
    dom.setAttr(element, "data-item-id", item.id);
    dom.setAttr(element, "data-render-id", render.id);

    return element;
  },

  /**
   * Called when a new element is created for use as a render.  This gives the {@link Layout}
   * the opportunity to customize the initial state of the render.  If an element already exists for
   * a previous render, and the element will be re-used for a transition, this method is not called.
   */
  initializeRender: function initializeRender(render) {
    if (this.config.debugLoading) {
      console.log("Viewport#initializeRender: initializing render", render);
    }

    validate(render, "render", { isRequired: true });

    this.layout.initializeRender(render, this.layoutMethodOptions);
  },

  /**
   * Delegates to the Layout instance to load the render contents.
   *
   * @param {!Object} render - render to load
   * @return {undefined}
   */
  loadRender: function loadRender(render) {
    if (this.config.debugLoading) {
      console.log("Viewport#loadRender: loading render", render);
    }

    validate(render, "render", { isRequired: true });

    this.layout.loadRender(render, this.layoutMethodOptions);

    if (render.isLoadNeeded) {
      render.isLoadNeeded = false;
    }
  },

  /**
   * Delegates to the layout instance to unload the render contents.
   *
   * @param {!Object} render - render to unload
   * @return {undefined}
   */
  unloadRender: function unloadRender(render) {
    if (this.config.debugLoading) {
      console.log("Viewport#unloadRender: initializing render", render);
    }

    validate(render, "render", { isRequired: true });

    this.layout.unloadRender(render, this.layoutMethodOptions);
  },

  /**
   * Returns a boolean indicating whether this render should be loaded at this time.
   *
   * The {@link Layout} can implement a method "shouldLoadRender" to specifiy whether
   * any given render should be loaded.
   *
   * If the {@link Layout} returns false
   *
   * @param {!Object} render - render to check whether it needs to be loaded
   * @return {boolean}
   */
  shouldLoadRender: function shouldLoadRender(render) {
    validate(render, "render", { isRequired: true });

    // Ask the layout if the render should be loaded
    var layoutShouldLoadRender = this.layout.shouldLoadRender(render, this.layoutMethodOptions);

    // Check if the render "isLoadNeeded" flag is set
    var renderShouldLoadRender = render.isLoadNeeded;

    // Check if the render element is visible in the frame
    var frameShouldLoadRender = this.frame.isElementVisible(render.element);

    if (this.config.debugLoading) {
      console.log(
        "Viewport#shouldLoadRender: layout: %s, render: %s, frame: %s",
        layoutShouldLoadRender,
        renderShouldLoadRender,
        frameShouldLoadRender,
        render);
    }

    return layoutShouldLoadRender || renderShouldLoadRender || frameShouldLoadRender;
  },

  /**
   * Loads or unloads a render depending on factors like whether its visible in the
   * frame element, etc.
   *
   * @param {!Object} render render to load or unload
   * @return {undefined}
   */
  loadOrUnloadRender: function loadOrUnloadRender(render) {
    if (this.shouldLoadRender(render)) {
      this.loadRender(render);
    } else {
      this.unloadRender(render);
    }
  },

  /**
   * Loads or unloads all the renders managed by the Viewport.
   *
   * @return {undefined}
   */
  loadOrUnloadRenders: function loadOrUnloadRenders() {
    if (this.config.debugLoading) {
      console.log("Viewport#loadOrUnloadRenders: loading or unloading renders");
    }

    _.each(this.getRenders(), function(render) {
      this.loadOrUnloadRender(render);
    }, this);
  },

  /**
   * Stops the animation for a render.
   *
   * @param render
   * @return {undefined}
   */
  stopRenderAnimation: function stopRenderAnimation(render) {
    if (!this.useAnimationStopping) {
      return;
    }

    validate(render, "Viewport#stopRenderAnimation: render", { isRequired: true });

    if (this.config.debugDrawing) {
      console.log("Viewport#stopRenderAnimation: stopping animation for render", render);
    }

    this.animator.animate(render.element, "stop", true);

    render.isAnimating = false;
    this.renderAnimationCount--;

    if (this.config.debugDrawing) {
      console.log(
        "Viewport#stopRenderAnimation: stopped animation for render (" +
        this.renderAnimationCount +
        ")",
        render);
    }
  },

  /**
   * Gets the custom renders
   *
   * @return {undefined}
   */
  getCustomRenders: function getCustomRenders() {
    return this.customRenders;
  },

  /**
   * Gets a custom render by id
   *
   * @param id
   * @return {undefined}
   */
  getCustomRender: function getCustomRender(id) {
    return this.customRenders[id];
  },

  /**
   * Sets a custom render in the internal data structure
   *
   * @param customRender
   * @return {undefined}
   */
  setCustomRender: function setCustomRender(customRender) {
    validate(customRender, "customRender", { isRequired: true });

    this.customRenders[customRender.id] = customRender;
  },

  /**
   * Removes a custom render from the internal data structure.
   *
   * @param customRender
   * @return {undefined}
   */
  removeCustomRender: function removeCustomRender(customRender) {
    validate(customRender, "customRender", { isRequired: true });

    delete this.customRenders[customRender.id];

    this.emit(DecksEvent("viewport:custom:render:erased", this, customRender));
  },

  /**
   * Indicates if there are any custom renders.
   *
   * @return {undefined}
   */
  hasCustomRenders: function hasCustomRenders() {
    return !_.isEmpty(this.customRenders);
  },

  /**
   * Draws a custom render by initiating its animation.
   *
   * @param customRender
   * @return {undefined}
   */
  drawCustomRender: function drawCustomRender(customRender) {
    var self = this;

    validate(customRender, "customRender", { isRequired: true });

    self.setDefaultCustomRenderAnimateOptions(customRender);

    this.setCustomRender(customRender);

    raf(function() {
      var eventName = customRender.isErasing ? "viewport:custom:render:erasing" : "viewport:custom:render:drawing";
      self.emit(DecksEvent(eventName, self, customRender));

      raf(function() {
        self.customRenderAnimationCount++;

        if (self.config.debugDrawing) {
          console.log("Viewport#drawCustomRender: custom renders drawing count: " + self.customRenderAnimationCount);
        }

        self.animator.animate({
          elements: customRender.element,
          properties: customRender.transform,
          options: customRender.animateOptions
        });
      });
    });
  },

  /**
   * Calls the {@link Layout} to get custom renders, and initiates the drawing cycle for all of them.
   *
   * @return {undefined}
   */
  drawCustomRenders: function drawCustomRenders() {
    if (this.config.debugDrawing) {
      console.log("Viewport#drawCustomRenders: drawing custom renders");
    }

    var layoutCustomRenders = this.layout.getCustomRenders(this.layoutMethodOptions);

    if (!layoutCustomRenders || _.isEmpty(layoutCustomRenders)) {
      return;
    }

    if (!_.isArray(layoutCustomRenders)) {
      layoutCustomRenders = [layoutCustomRenders];
    }

    var customRenders = {};

    _.each(layoutCustomRenders, function(customRender, index) {
      validate(customRender.element, "Viewport#drawCustomRenders: customRender.element", { isElement: true });
      customRender.id = customRender.element.id || ("" + _.uniqueId());
      customRender.index = index;
      customRenders[customRender.id] = customRender;
      this.drawCustomRender(customRender);
    }, this);
  },

  /**
   * Marks a custom render as needing to be erased, and starts the erase animation.
   *
   * @param customRender
   * @return {undefined}
   */
  eraseCustomRender: function eraseCustomRender(customRender) {
    validate(customRender, "customRender", { isRequired: true });

    if (customRender.isErasing) {
      return;
    }

    customRender.isErasing = true;

    this.layout.setHideAnimation(customRender, this.layoutMethodOptions);

    this.drawCustomRender(customRender);
  },

  /**
   * Erases all the custom renders.
   *
   * @return {undefined}
   */
  eraseCustomRenders: function eraseCustomRenders() {
    if (this.config.debugDrawing) {
      console.log("Viewport#eraseCustomRenders: erasing custom renders");
    }

    _.each(this.getCustomRenders(), function(customRender) {
      this.eraseCustomRender(customRender);
    }, this);
  },

  /**
   * Sets the default animation options for a custom render animation.
   *
   * @param customRender
   * @return {undefined}
   */
  setDefaultCustomRenderAnimateOptions: function setDefaultCustomRenderAnimateOptions(customRender) {
    var self = this;

    validate(customRender, "customRender", { isRequired: true });

    customRender.animateOptions = customRender.animateOptions || {};

    customRender.animateOptions.complete = function() {
      self.onCustomRenderAnimationComplete(customRender);
    };
  },

  /**
   * Helper function for creating a custom render element with a default position.
   *
   * @param customRender
   * @return {undefined}
   */
  createCustomRenderElement: function createCustomRenderElement() {
    var element = dom.create("div");
    element.id = this.config.customRenderClassName + "-" + _.uniqueId();
    dom.addClass(element, this.config.customRenderClassName);
    dom.setStyle(element, "position", "absolute");
    dom.setStyle(element, "top", 0);
    dom.setStyle(element, "left", 0);
    return element;
  },

  /**
   * Pans the {@link Canvas} to the {@link Item}'s render element specified by renderIdOrIndex.
   *
   * @param {!Item} item - item to pan to
   * @param {?(string|number)} [renderIdOrIndex=0] - render id or index to pan to
   * @return {undefined}
   */
  panToItem: function panToItem(item, renderIdOrIndex) {
    validate(item, "Viewport#panToItem: item", { isInstanceOf: Item });

    var render = this.getRender(item, renderIdOrIndex);

    validate(render, "Viewport#panToItem: render", { isRequired: true });
    validate(render.element, "Viewport#panToItem: render.element", { isRequired: true });

    this.canvas.panToElement(render.element);
  },

  /**
   * Configures gestures for a single render.
   *
   * @param render
   * @return {undefined}
   */
  configureRenderGestures: function configureRenderGestures(render) {
    if (render.isErasing) {
      this.removeRenderGestureHandler(render);
    } else {
      this.addRenderGestureHandler(render);
    }
  },

  /**
   * Configures gestures for all renders
   *
   * @return {undefined}
   */
  configureAllRenderGestures: function() {
    if (this.config.debugGestures) {
      console.log("Viewport#configureAllRenderGestures: configuring all render gestures");
    }

    var renders = this.getRenders();

    _.each(renders, function(render) {
      this.configureRenderGestures(render);
    }, this);
  },

  /**
   * Destroys gestures for all renders.
   *
   * @return {undefined}
   */
  destroyRenderGestures: function() {
    if (this.config.debugGestures) {
      console.log("Viewport#destroyRenderGestures: destroying all render gestures");
    }

    _.each(this.gestureHandlerGroups, function(gestureHandlerGroup) {
      gestureHandlerGroup.destroy();
    }, this);

    // Clear the gesture handler group id off all renders
    _.each(this.getRenders(), function(render) {
      delete render.gestureHandlerGroupId;
    });

    this.gestureHandlerGroups = {};
  },

  /**
   * Adds a {@link GestureHandler} for the render, and puts it in a {@link GestureHandlerGroup}
   * according to the render.gestureHandlerGroupId.
   *
   * @param render
   * @return {undefined}
   */
  addRenderGestureHandler: function addRenderGestureHandler(render) {
    var gestureHandlerGroupId = render.gestureHandlerGroupId;

    if (!gestureHandlerGroupId) {
      return;
    }

    // Get the GestureHandlerGroup options from the Layout
    var layoutGestureHandlerOptions = this.layout.getRenderGestureOptions(render, this.layoutMethodOptions);

    // Create the GestureHandlerGroup if it doesn't exist
    if (!this.gestureHandlerGroups[gestureHandlerGroupId]) {
      var defaultGestureHandlerGroupOptions = {
        config: this.config,
        emitter: this.emitter,
        containerElement: this.canvas.element
      };

      var gestureHandlerGroupOptions = _.extend(defaultGestureHandlerGroupOptions, layoutGestureHandlerOptions);

      this.gestureHandlerGroups[gestureHandlerGroupId] = new GestureHandlerGroup(gestureHandlerGroupOptions);
    }

    // Get a reference to the group
    var gestureHandlerGroup = this.gestureHandlerGroups[gestureHandlerGroupId];

    // If the element is already in the group, bail
    if (gestureHandlerGroup.hasGestureHandlerForElement(render.element)) {
      return;
    }

    // Create the GestureHandler to add to the GestureHandlerGroup
    var defaultGestureHandlerOptions = {
      animator: this.animator,
      config: this.config,
      emitter: this.emitter,
      element: render.element,
      bounds: this.frame.bounds,
      snapping: {
        toBounds: false,
        hardStopAtBounds: true,
        reduceMovementAtBounds: false,
        toNearestChildElement: false
      }
    };

    var gestureHandlerOptions = _.merge(defaultGestureHandlerOptions, layoutGestureHandlerOptions);

    var gestureHandler = new GestureHandler(gestureHandlerOptions);

    if (this.config.debugGestures) {
      console.log("Viewport#addRenderGestureHandler: adding gesture handler", gestureHandlerGroupId, render);
    }

    gestureHandlerGroup.addGestureHandler(gestureHandler);
  },

  /**
   * Removes the {@link GestureHandler} for a render.
   *
   * @param render
   * @return {undefined}
   */
  removeRenderGestureHandler: function removeRenderGestureHandler(render) {
    var gestureHandlerGroupId = render.gestureHandlerGroupId;

    if (!gestureHandlerGroupId) {
      // No gesture handler group id specified
      return;
    }

    if (!this.gestureHandlerGroups[gestureHandlerGroupId]) {
      // No gesture handler group exists for this id
      return;
    }

    var gestureHandlerGroup = this.gestureHandlerGroups[gestureHandlerGroupId];

    if (this.config.debugGestures) {
      console.log("Viewport#removeRenderGestureHandler: removing gesture handler", gestureHandlerGroupId, render);
    }

    gestureHandlerGroup.removeGestureHandlerForElement(render.element);
  },


  /**
   * Called when the {@link Deck} is ready.  Triggers a draw/load cycle.
   *
   * This draw cycle can be prevented from happening by setting the drawOnDeckReady to false in the
   * {@link Viewport} options.
   *
   * @return {undefined}
   */
  onDeckReady: function onDeckReady() {
    if (this.config.debugDrawing) {
      console.log("Viewport#onDeckReady");
    }

    this.isDeckReady = true;

    if (!this.canDraw(this.drawOnDeckReady)) {
      return;
    }

    this.drawItems({ isLoadNeeded: true }); // Needs loading because the items haven't been loaded before
  },

  /**
   * Called when a draw request is made on the {@link Deck}.  Triggers a redraw/reload cycle.
   *
   * @return {undefined}
   */
  onDeckDraw: function onDeckDraw() {
    if (this.config.debugDrawing) {
      console.log("Viewport#onDeckDraw");
    }

    if (!this.canDraw()) {
      return;
    }

    this.eraseCustomRenders();

    this.drawItems({ isLoadNeeded: true }); // Needs loading because this is a manual, programmatic draw request
  },

  /**
   * Called before the {@link Deck} {@link Layout} is about to be set.
   *
   * @return {undefined}
   */
  onDeckLayoutSetting: function onDeckLayoutSetting() {
    if (this.config.debugDrawing) {
      console.log("Viewport#onDeckLayoutSetting");
    }

    if (!this.canDraw()) {
      return;
    }

    this.eraseCustomRenders();

    this.destroyRenderGestures();
  },

  /**
   * Called when a new layout is set on the {@link Deck}.  Triggers a redraw/reload cycle.
   *
   * @return {undefined}
   */
  onDeckLayoutSet: function onDeckLayoutSet(e) {
    if (this.config.debugDrawing) {
      console.log("Viewport#onDeckLayoutSet");
    }

    var layout = e.data;

    this.setLayout(layout);

    if (!this.canDraw()) {
      return;
    }

    this.drawItems({ isLoadNeeded: true }); // Needs loading because different layouts may have different item representations.
  },

  /**
   * Called before the {@link Frame} bounds are about to be set.
   *
   * @return {undefined}
   */
  onFrameBoundsSetting: function onFrameBoundsSetting() {
    if (this.config.debugDrawing) {
      console.log("Viewport#onFrameBoundsSetting");
    }

    if (!this.canDraw()) {
      return;
    }

    this.eraseCustomRenders();
  },

  /**
   * Called when the {@link Frame} bounds are set.  Triggers a redraw cycle.
   *
   * @return {undefined}
   */
  onFrameBoundsSet: function onFrameBoundsSet() {
    if (this.config.debugDrawing) {
      console.log("Viewport#onFrameBoundsSet");
    }

    if (!this.canDraw()) {
      return;
    }

    this.drawItems({ isLoadNeeded: false }); // Doesn't need loading because we should just be moving things around based on new frame bounds
  },

  /**
   * Called when an {@link Item} is changed
   *
   * @param e
   * @return {undefined}
   */
  onItemChanged: function onItemChanged(e) {
    if (this.config.debugDrawing) {
      console.log("Viewport#onItemChanged");
    }

    if (!this.canDraw()) {
      return;
    }

    var item = e.sender;

    this.eraseCustomRenders();

    this.drawItem(item, { isLoadNeeded: true }); // Needs loading because change to item might require new representation.
  },

  onItemIndexChanged: function onItemIndexChanged() {
    // TODO: remove if not needed
  },

  onItemCollectionItemAdding: function onItemCollectionItemAdding() {
    if (this.config.debugDrawing) {
      console.log("Viewport#onItemCollectionItemAdding");
    }

    if (!this.canDraw()) {
      return;
    }

    this.eraseCustomRenders();
  },

  onItemCollectionItemAdded: function onItemCollectionItemAdded() {
    if (this.config.debugDrawing) {
      console.log("Viewport#onItemCollectionItemAdded");
    }

    if (!this.canDraw()) {
      return;
    }

    this.drawItems({ isLoadNeeded: true });
  },

  onItemCollectionItemsAdding: function onItemCollectionItemAdding() {
    if (this.config.debugDrawing) {
      console.log("Viewport#onItemCollectionItemAdding");
    }

    if (!this.canDraw()) {
      return;
    }

    this.eraseCustomRenders();
  },

  onItemCollectionItemsAdded: function onItemCollectionItemAdded() {
    if (this.config.debugDrawing) {
      console.log("Viewport#onItemCollectionItemsAdded");
    }

    if (!this.canDraw()) {
      return;
    }

    this.drawItems({ isLoadNeeded: true });
  },

  onItemCollectionItemRemoving: function onItemCollectionItemRemoving() {
    if (this.config.debugDrawing) {
      console.log("Viewport#onItemCollectionItemRemoving");
    }

    if (!this.canDraw()) {
      return;
    }

    this.eraseCustomRenders();
  },

  onItemCollectionItemRemoved: function onItemCollectionItemRemoved(e) {
    if (this.config.debugDrawing) {
      console.log("Viewport#onItemCollectionItemRemoved");
    }

    if (!this.canDraw()) {
      return;
    }

    var item = e.data;

    // Start the erase animations for all the renders for the item that was removed
    this.eraseItem(item);

    // Re-draw all the other items - this is needed because the removal of an item might
    // require other items to be re-drawn too.
    // The Item is already removed from the ItemCollection when this is called, so re-draw all the other
    // Items
    this.drawItems({ isLoadNeeded: false });
  },

  onItemCollectionClearing: function onItemCollectionClearing() {
    if (this.config.debugDrawing) {
      console.log("Viewport#onItemCollectionClearing");
    }

    if (!this.canDraw()) {
      return;
    }

    this.eraseCustomRenders();
  },

  onItemCollectionCleared: function onItemCollectionCleared(e) {
    if (this.config.debugDrawing) {
      console.log("Viewport#onItemCollectionCleared");
    }

    if (!this.canDraw()) {
      return;
    }

    var items = e.data;

    this.eraseItems(items);
  },

  onItemCollectionFilterSetting: function() {
    if (this.config.debugDrawing) {
      console.log("Viewport#onItemCollectionFilterSetting");
    }

    if (!this.canDraw()) {
      return;
    }

    this.destroyRenderGestures();
  },

  onItemCollectionFilterSet: function() {
    // TODO: remove if not needed
  },

  onItemCollectionSortBySetting: function() {
    if (this.config.debugDrawing) {
      console.log("Viewport#onItemCollectionSortBySetting");
    }

    if (!this.canDraw()) {
      return;
    }

    this.destroyRenderGestures();
  },

  onItemCollectionSortBySet: function() {
    // TODO: remove if not needed
  },

  onItemCollectionReversedSetting: function() {
    if (this.config.debugDrawing) {
      console.log("Viewport#onItemCollectionReversedSetting");
    }

    if (!this.canDraw()) {
      return;
    }

    this.destroyRenderGestures();
  },

  onItemCollectionReversedSet: function() {
    // TODO: remove if not needed
  },

  onItemCollectionIndexing: function onItemCollectionIndexing() {
    if (this.config.debugDrawing) {
      console.log("Viewport#onItemCollectionIndexing");
    }

    if (!this.canDraw()) {
      return;
    }

    this.eraseCustomRenders();
  },

  onItemCollectionIndexed: function onItemCollectionIndexed(e) {
    if (this.config.debugDrawing) {
      console.log("Viewport#onItemCollectionIndexed");
    }

    if (!this.canDraw()) {
      return;
    }

    var stats = e.data;

    if (stats.reason.isSetFilter || stats.reason.isSetSortBy || stats.reason.isSetReversed) {
      this.drawItems({ loadNeeded: false });

      if (stats.totalCount === 0 || stats.changedCount === 0) {
        this.drawCustomRenders();
      }
    }
  },

  /**
   * Called when an individual render animation completes.
   *
   * This updates the render data in the internal data structure, or removes the render if it was being
   * erased.  It also checks for the completion of a full render cycle, which might trigger additional events.
   *
   * @param render
   * @return {undefined}
   */
  onRenderAnimationComplete: function onRenderAnimationComplete(render) {
    validate(render, "Viewport#onRenderAnimationComplete: render", { isRequired: true });

    render.isAnimating = false;
    this.renderAnimationCount--;

    if (this.config.debugDrawing) {
      console.log(
        "Viewport#onRenderAnimationComplete: render animation complete (" +
        this.renderAnimationCount +
        ")",
        render);
    }

    if (render.isErasing) {
      this.removeRender(render);

      if (render.item.isErasing && !this.hasRenders(render.item)) {
        this.removeItem(render.item);
      }
    } else {
      this.emit(DecksEvent("viewport:render:drawn", this, render));
    }

    if (this.renderAnimationCount === 0) {
      this.onAllRenderAnimationsComplete();
    }
  },

  /**
   * Called when all the animations in a render cycle have been completed.
   *
   * @return {undefined}
   */
  onAllRenderAnimationsComplete: function onAllRenderAnimationsComplete() {
    var self = this;

    if (self.config.debugDrawing) {
      console.log("Viewport#onAllRenderAnimationsComplete: all render animations complete");
    }

    _.defer(function() {
      self.emit(DecksEvent("viewport:all:renders:drawn", self));

      _.defer(function() {
        self.loadOrUnloadRenders();

        _.defer(function() {
          self.drawCustomRenders();

          _.defer(function() {
            self.configureAllRenderGestures();
          });
        });
      });
    });
  },

  /**
   * Called when a custom render animation completes.  Adds the custom render to the internal data structure,
   * or removes it if the custom render was being erased.
   *
   * This also checks for the end of the drawing cycle for all custom renders, and may perform additional
   * logic at the end of the cycle.
   *
   * @param customRender
   * @return {undefined}
   */
  onCustomRenderAnimationComplete: function onCustomRenderAnimationComplete(customRender) {
    validate(customRender, "Viewport#onCustomRenderAnimationComplete: customRender", { isRequired: true });

    this.customRenderAnimationCount--;

    if (this.config.debugDrawing) {
      console.log(
        "Viewport#onCustomRenderAnimationComplete: custom render animation complete (" +
        this.customRenderAnimationCount +
        ")",
        customRender);
    }

    if (customRender.isErasing) {
      this.removeCustomRender(customRender);
    } else {
      this.emit(DecksEvent("viewport:custom:render:drawn", this, customRender));
    }

    if (this.customRenderAnimationCount === 0) {
      this.onAllCustomRenderAnimationsComplete();
    }
  },

  /**
   * Called when all the custom render animations have been completed.
   *
   * @return {undefined}
   */
  onAllCustomRenderAnimationsComplete: function onAllCustomRenderAnimationsComplete() {
    var self = this;

    if (this.config.debugDrawing) {
      console.log("Viewport#onAllCustomRenderAnimationsComplete: all custom render animations complete");
    }

    _.defer(function() {
      self.emit(DecksEvent("viewport:all:custom:renders:drawn", self));
    });
  },

  /**
   * Called when an element is moved via a gesture.
   *
   * @param e
   * @return {undefined}
   */
  onGestureElementMoved: function onGestureElementMoved(e) {
    var element = e.data;

    if (element === this.canvas.element) {
      this.onCanvasElementMoved(e);
    }
  },

  /**
   * Called when the {@link Canvas} element is moved via a touch gesture.
   *
   * @return {undefined}
   */
  onCanvasElementMoved: function onCanvasElementMoved() {
    this.loadOrUnloadRenders();
  }
});

module.exports = Viewport;

},{"./canvas":2,"./events":8,"./frame":9,"./item":11,"./itemcollection":12,"./layout":13,"./ui":24,"./ui/gesturehandler":22,"./ui/gesturehandlergroup":23,"./utils/validate":36,"lodash":"lodash","raf":"raf"}]},{},[1])(1)
});