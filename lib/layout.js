var _ = require("lodash");
var binder = require("./events/binder");

/**
 * Contains the logic for rendering a layout of items
 *
 * Can be subclassed to implement layout methods, or can be passed
 * layout methods in the Layout constructor options.
 *
 * @class
 * @param {?Object} options - layout options
 * @param {?Function} options.getRenders - implementation of getRenders method
 * @param {?Function} options.initializeRender - implementation of initializeRender method
 * @param {?Function} options.loadRender - implementation of loadRender method
 * @param {?Function} options.unloadRender - implementation of unloadRender method
 * @param {?Function} options.getShowAnimation - implementation of getShowAnimation method
 * @param {?Function} options.getHideAnimation - implementation of getHideAnimation method
 * @param {?Function} options.setShowAnimation - implementation of setShowAnimation method
 * @param {?Function} options.setHideAnimation - implementation of setHideAnimation method
 */
function Layout(options) {
  if (!(this instanceof Layout)) {
    return new Layout(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  // Allow the caller to create a Layout implementation without subclassing Layout -
  // just by passing in implementations of the key methods in options
  _.each(this.overridables, function(key) {
    if (options[key]) {
      this[key] = options[key];
    }
  }, this);
}

_.extend(Layout.prototype, binder, /** @lends Layout.prototype */ {
  defaultOptions: {
  },

  emitterEvents: {
    "viewport:render:drawing": "onViewportRenderDrawing",
    "viewport:render:erasing": "onViewportRenderErasing",
    "viewport:render:drawn": "onViewportRenderDrawn",
    "viewport:render:erased": "onViewportRenderErased"
  },

  overridables: [
    "getRenders",
    "initializeRender",
    "loadRender",
    "unloadRender",
    "getShowAnimation",
    "getHideAnimation",
    "setShowAnimation",
    "setHideAnimation",
    "getCanvasGestureOptions",
    "onViewportRenderDrawing",
    "onViewportRenderErasing",
    "onViewportRenderDrawn",
    "onViewportRenderErased"
  ],

  /**
   * Creates the renders for a given {@link Item}
   *
   * @param {Item} item - Item for which to create renders
   * @param {Object} options - Other options provided by the {@link Viewport}
   * @return {(Object|Object[])} - The renders for the {@link Item}
   */
  getRenders: function(/*item, options*/) {
    throw new Error("Layout#getRenders not implemented");
  },

  /**
   * Allows the layout to initialize a new render object (element)
   *
   * @param {Object} render - The render object that was just created
   * @return {undefined}
   */
  initializeRender: function(render, options) {
    // Call unloadRender by default, as these methods are probably similar
    this.unloadRender(render, options);
  },

  /**
   * Contains the logic to load the contents of a render (e.g. load an image in the render element)
   *
   * @param {Object} render - The render object to load
   * @return {undefined}
   */
  loadRender: function(/*render, options*/) {
    throw new Error("Layout#loadRender not implemented");
  },

  /**
   * Contains the logic to unload the contents of a render (e.g. remove the DOM content of a render element)
   *
   * @param {Object} render - The render object to unload
   * @param {Object} options
   * @return {undefined}
   */
  unloadRender: function(/*render, options*/) {
    throw new Error("Layout#unloadRender not implemented");
  },

  onViewportRenderDrawing: function(/*render, options*/) {
    //console.warn("Layout#onViewportRenderDrawing not implemented");
  },

  onViewportRenderErasing: function(/*render, options*/) {
    //console.warn("Layout#onViewportRenderErasing not implemented");
  },

  onViewportRenderDrawn: function(/*render, options*/) {
    //console.warn("Layout#onViewportRenderDrawn not implemented");
  },

  onViewportRenderErased: function(/*render, options*/) {
    //console.warn("Layout#onViewportRenderErased not implemented");
  },

  /**
   * Gets the animation to use when showing a render
   */
  getShowAnimation: function() {
    return {
      transform: {
        opacity: 1,
        scaleX: 1,
        scaleY: 1
      },
      animateOptions: {
        duration: 400,
        display: "auto"
      }
    };
  },

  /**
   * Gets the base animation to use when hiding (removing) a render
   */
  getHideAnimation: function() {
    return {
      transform: {
        opacity: 0,
        scaleX: 0,
        scaleY: 0
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
   * @return {undefined}
   */
  setShowAnimation: function(render) {
    _.merge(render, this.getShowAnimation());
  },

  /**
   * Sets an animation on a render to remove the render.  The implementation of this method should set
   * transform and animateOptions properties on the render.
   *
   * @param {!Object} render render on which to set animation
   * @return {undefined}
   */
  setHideAnimation: function(render) {
    _.merge(render, this.getHideAnimation());
  },

  getCanvasGestureOptions: function() {
    return null;
  }
});

module.exports = Layout;
