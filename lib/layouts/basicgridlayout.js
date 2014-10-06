var _ = require("lodash");
var Layout = require("../Layout");
var inherits = require("inherits");

/**
 * Basic grid layout
 *
 * @constructor
 * @augments Layout
 * @param {?Object} options additional options
 */
function BasicGridLayout(options) {
  if (!(this instanceof BasicGridLayout)) { return new BasicGridLayout(options); }
  options = options || {};
  this.itemWidth = options.itemWidth || 300;
  this.itemHeight = options.itemHeight || 200;
  this.itemPadding = options.itemPadding || 10;
  this.itemsPerRow = options.itemsPerRow || 4;
  this.transform = options.transform || {};
  this.animateOptions = options.animateOptions || {};
  Layout.call(this, options);
}

inherits(BasicGridLayout, Layout);

_.extend(BasicGridLayout.prototype, /** @lends BasicGridLayout.prototype */ {
  /**
   * Gets the top position for an item by index
   *
   * @param {Number} index index of item
   * @return {Number} top value
   */
  getTop: function(index) {
    var row = Math.floor(index / this.itemsPerRow);
    return row * (this.itemHeight + this.itemPadding) + this.itemPadding;
  },

  /**
   * Gets the left position for an item by index
   *
   * @param {Number} index index of item
   * @return {Number} left value
   */
  getLeft: function(index) {
    var column = index % this.itemsPerRow;
    return column * (this.itemWidth + this.itemPadding) + this.itemPadding;
  },

  /**
   * Creates a transform for an item
   *
   * @param {!Object} options options for which to create transform
   * @return {Object} transform options
   */
  getTransform: function(options) {
    return _.extend({}, this.transform, {
      top: this.getTop(options.index),
      left: this.getLeft(options.index),
      width: this.itemWidth,
      height: this.itemHeight
    });
  },

  /**
   * Gets the animate options for an item
   *
   * @param {!Object} options options for which to create animation
   * @return {Object} animate options
   */
  getAnimateOptions: function(options) {
    return _.extend({}, {
      // default options ?
      duration: 400
    }, this.animateOptions);
  },

  /**
   * Gets the array of renders for the given item options
   *
   * @param {!Object} options options for which to create renders
   * @return {Array<Object>} renders for the item (options)
   */
  getRenders: function(options) {
    return [
      {
        transform: this.getTransform(options),
        animateOptions: this.getAnimateOptions(options)
      }
    ];
  }
});

module.exports = BasicGridLayout;
