var _ = require("lodash");
var Layout = require("../layout");

/**
 * Basic grid layout
 *
 * @class
 * @extends Layout
 * @param {?Object} options additional options
 */
function BasicGridLayout(options) {
  if (!(this instanceof BasicGridLayout)) { return new BasicGridLayout(options); }
  options = options || {};
  this.itemWidth = options.itemWidth || 300;
  this.itemHeight = options.itemHeight || 200;
  this.transform = options.transform || {};
  this.animateOptions = options.animateOptions || {};
  Layout.call(this, options);
}

BasicGridLayout.prototype = _.create(Layout.prototype, /** @lends BasicGridLayout.prototype */ {
  constructor: BasicGridLayout,

  getItemsPerRow: function(width) {
    return Math.floor(width / this.itemWidth);
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
    var itemPadding = this.getItemPadding(itemsPerRow, width);

    return _.merge({}, this.transform, {
      top: this.getTop(index, itemsPerRow, itemPadding),
      left: this.getLeft(index, itemsPerRow, itemPadding),
      width: this.itemWidth,
      height: this.itemHeight
    });
  },

  getAnimateOptions: function(/*item*/) {
    return _.merge({
      duration: 400,
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
  }
});

module.exports = BasicGridLayout;
