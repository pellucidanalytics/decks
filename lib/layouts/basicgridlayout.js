var _ = require("lodash");
var Layout = require("../layout");
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
  getTop: function(index) {
    var row = Math.floor(index / this.itemsPerRow);
    return row * (this.itemHeight + this.itemPadding) + this.itemPadding;
  },

  getLeft: function(index) {
    var column = index % this.itemsPerRow;
    return column * (this.itemWidth + this.itemPadding) + this.itemPadding;
  },

  getTransform: function(item) {
    var index = item.index;
    return _.merge({}, this.transform, {
      top: this.getTop(index),
      left: this.getLeft(index),
      width: this.itemWidth,
      height: this.itemHeight
    });
  },

  getAnimateOptions: function(/*item*/) {
    return _.merge({
      duration: 400,
    }, this.animateOptions);
  },

  getRenders: function(item) {
    if (item.index === -1) {
      return this.getHideAnimation();
    }

    return _.merge(this.getShowAnimation(), {
      transform: this.getTransform(item),
      animateOptions: this.getAnimateOptions(item)
    });
  }
});

module.exports = BasicGridLayout;
