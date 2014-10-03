var _ = require("lodash");
var Layout = require("../Layout");
var inherits = require("inherits");

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

_.extend(BasicGridLayout.prototype, {

  getTop: function(index) {
    var row = Math.floor(index / this.itemsPerRow);
    return row * (this.itemHeight + this.itemPadding) + this.itemPadding;
  },

  getLeft: function(index) {
    var column = index % this.itemsPerRow;
    return column * (this.itemWidth + this.itemPadding) + this.itemPadding;
  },

  getTransform: function(options) {
    return _.extend({}, this.transform, {
      top: this.getTop(options.index),
      left: this.getLeft(options.index),
      width: this.itemWidth,
      height: this.itemHeight
    });
  },

  getAnimateOptions: function(options) {
    return _.extend({}, {
      // default options ?
      duration: 400
    }, this.animateOptions);
  },

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
