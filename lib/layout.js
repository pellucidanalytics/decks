var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");

/**
 * Contains the logic for rendering a layout of items
 *
 * Can be subclassed to implement layout methods, or can be passed
 * layout methods in the Layout constructor options.
 *
 * @constructor
 * @augments EventEmitter2
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
  if (!(this instanceof Layout)) { return new Layout(options); }
  options = options || {};
  EventEmitter.call(this);

  // Allow the caller to create a Layout implementation without subclassing Layout -
  // just by passing in implementations of the key methods in options
  _.each(Layout._overridables, function(key) {
    if (options[key]) {
      this[key] = options[key];
    }
  }, this);
}

inherits(Layout, EventEmitter);

Layout._overridables = [
  "getRenders",
  "loadRender",
  "unloadRender",
  "getShowAnimation",
  "getHideAnimation",
  "setShowAnimation",
  "setHideAnimation"
],

_.extend(Layout.prototype, /** @lends Layout.prototype */ {
  /**
   * Creates the renders for a given item options
   *
   * @param {Object} options render options
   * @return {undefined}
   */
  getRenders: function(/*item*/) {
    throw new Error("getRenders is not implemented");
  },

  /**
   * Contains the logic to load the contents of a render (e.g. load an image in the render element)
   *
   * @param {?Object} options load options
   * @return {undefined}
   */
  loadRender: function(/*render*/) {
    throw new Error("loadRender is not implemented");
  },

  /**
   * Contains the logic to unload the contents of a render (e.g. remove the DOM content of a render element)
   *
   * @param {?Object} options unload options
   * @return {undefined}
   */
  unloadRender: function(/*render*/) {
    throw new Error("unloadRender is not implemented");
  },

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

  setShowAnimation: function(render) {
    var showAnimation = this.getShowAnimation();
    render.transform = _.merge(showAnimation.transform, render.transform);
    render.animateOptions = _.merge(showAnimation.animateOptions, render.animateOptions);
  },

  /**
   * Sets an animation on a render to remove the render.  The implementation of this method should set
   * transform and animateOptions properties on the render.
   *
   * @param {Object} render render on which to set animation
   * @return {undefined}
   */
  setHideAnimation: function(render) {
    var hideAnimation = this.getHideAnimation();
    render.transform = _.merge(hideAnimation.transform, render.transform);
    render.animateOptions = _.merge(hideAnimation.animateOptions, render.animateOptions);
  },

  /**
   * Sets the Layout's Viewport
   *
   * @param {Viewport} viewport viewport to set
   * @param {?Object} options additional options
   * @return {undefined}
   */
  setViewport: function(viewport, options) {
    if (!viewport) { throw new Error("viewport is required"); }
    options = options || {};

    if (this.viewport === viewport) { return; }

    this.viewport = viewport;

    if (!options.silent) {
      this.emit("layout:viewport:set", this.viewport);
    }
  },

  /**
   * Sets the Layout's ItemCollection
   *
   * @param {ItemCollection} itemCollection ItemCollection instance to set
   * @param {?Object} options
   * @return {undefined}
   */
  setItemCollection: function(itemCollection, options) {
    if (!itemCollection) { throw new Error("itemCollection is required"); }
    options = options || {};

    if (this.itemCollection === itemCollection) { return; }

    this.itemCollection = itemCollection;

    if (!options.silent) {
      this.emit("layout:item:collection:set", this.itemCollection);
    }
  }
});

module.exports = Layout;
