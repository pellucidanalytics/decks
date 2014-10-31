var _ = require("lodash");

/**
 * Contains the logic for rendering a layout of items
 *
 * Can be subclassed to implement layout methods, or can be passed
 * layout methods in the Layout constructor options.
 *
 * @class
 * @param {?Object} options layout options
 * @param {?Function} options.getRenders implementation of getRenders method
 * @param {?Function} options.loadRender implementation of loadRender method
 * @param {?Function} options.unloadRender implementation of unloadRender method
 * @param {?Function} options.getShowAnimation implementation of getShowAnimation method
 * @param {?Function} options.getHideAnimation implementation of getHideAnimation method
 * @param {?Function} options.setShowAnimation implementation of setShowAnimation method
 * @param {?Function} options.setHideAnimation implementation of setHideAnimation method
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

_.extend(Layout.prototype, /** @lends Layout.prototype */ {
  defaultOptions: {
  },

  overridables: [
    "getRenders",
    "loadRender",
    "unloadRender",
    "getShowAnimation",
    "getHideAnimation",
    "setShowAnimation",
    "setHideAnimation",
    "getCanvasGestureOptions"
  ],

  /**
   * Creates the renders for a given {@link Item}
   *
   * @param {Item} item - Item for which to create renders
   * @param {Object} options - Other options provided by the {@link Viewport}
   * @return {(Object|Object[])} - The renders for the {@link Item}
   */
  getRenders: function() {
    throw new Error("Layout#getRenders: abstract method is not implemented");
  },

  /**
   * Contains the logic to load the contents of a render (e.g. load an image in the render element)
   *
   * @param {Object} render - The render object to load
   * @return {undefined}
   */
  loadRender: function() {
    throw new Error("Layout#loadRender: abstract method is not implemented");
  },

  /**
   * Contains the logic to unload the contents of a render (e.g. remove the DOM content of a render element)
   *
   * @param {Object} render - The render object to unload
   * @return {undefined}
   */
  unloadRender: function() {
    throw new Error("Layout#unloadRender: abstract method is not implemented");
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
    var showAnimation = this.getShowAnimation();
    render.transform = _.merge(showAnimation.transform, render.transform);
    render.animateOptions = _.merge(showAnimation.animateOptions, render.animateOptions);
  },

  /**
   * Sets an animation on a render to remove the render.  The implementation of this method should set
   * transform and animateOptions properties on the render.
   *
   * @param {!Object} render render on which to set animation
   * @return {undefined}
   */
  setHideAnimation: function(render) {
    var hideAnimation = this.getHideAnimation();
    render.transform = _.merge(hideAnimation.transform, render.transform);
    render.animateOptions = _.merge(hideAnimation.animateOptions, render.animateOptions);
  },

  getCanvasGestureOptions: function() {
    return null;
  }
});

module.exports = Layout;
