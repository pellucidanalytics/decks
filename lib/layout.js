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
      "shouldUnloadRender",
      "loadRender",
      "unloadRender",

      // Custom render-related methods
      "getCustomRenders",

      // Animation-related methods
      "getShowAnimation",
      "getHideAnimation",
      "setShowAnimation",
      "setHideAnimation",

      // Canvas/Gesture-related methods
      "getCanvasGestureOptions",
      "getMoveToElementOffsets",

      // Emitter event handlers
      "onViewportItemDrawing",
      "onViewportItemsDrawing",

      "onViewportRenderDrawing",
      "onViewportRenderErasing",
      "onViewportRenderDrawn",
      "onViewportRenderErased",
      "onViewportAllRendersDrawn",

      // TODO: add custom render event handlers?

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
      //"viewport:render:drawing": "onViewportRenderDrawing",
      //"viewport:render:erasing": "onViewportRenderErasing",
      //"viewport:render:drawn": "onViewportRenderDrawn",
      //"viewport:render:erased": "onViewportRenderErased",
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
   * @param {!Object} render - render object to check for loading
   * @param {!Object} options - hash of all deck-related objects
   * @return {undefined}
   */
  shouldLoadRender: function shouldLoadRender(/*render, options*/) {
    return true;
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
   * Returns whether the given render should be unloaded at the time of invocation.
   * The {@link Layout} can implement this method if there are cases where a render
   * should be unloaded (e.g. to save on memory).
   *
   * @param {!Object} render - render object to check for unloading.
   * @param {!Object} options - hash of all deck-related objects
   * @return {undefined}
   */
  shouldUnloadRender: function shouldUnloadRender(/*render, options*/) {
    return false;
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
      smartMarginRight: true,
      smartMarginBottom: true,
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
