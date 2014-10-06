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
 */
function Layout(options) {
  if (!(this instanceof Layout)) { return new Layout(options); }
  options = options || {};
  EventEmitter.call(this);

  _.each(["getRenders", "loadRender", "unloadRender"], function(key) {
    if (options[key]) {
      this[key] = options[key];
    }
  }, this);
}

inherits(Layout, EventEmitter);

_.extend(Layout.prototype, /** @lends Layout.prototype */ {
  /**
   * Creates the renders for a given item options
   *
   * @param {Object} options render options
   * @return {undefined}
   */
  getRenders: function(options) {
    throw new Error("getRenders is not implemented");
  },

  /**
   * Contains the logic to load the contents of a render (e.g. load an image in the render element)
   *
   * @param {?Object} options load options
   * @return {undefined}
   */
  loadRender: function(options) {
    throw new Error("loadRender is not implemented");
  },

  /**
   * Contains the logic to unload the contents of a render (e.g. remove the DOM content of a render element)
   *
   * @param {?Object} options unload options
   * @return {undefined}
   */
  unloadRender: function(options) {
    throw new Error("unloadRender is not implemented");
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

    this.itemCollection = itemCollection;

    if (!options.silent) {
      this.emit("layout:item:collection:set", this.itemCollection);
    }
  }
});

module.exports = Layout;
