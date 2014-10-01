var _ = require("lodash");
var Layout = require("../Layout");
var inherits = require("inherits");

function BasicGridLayout(options) {
  if (!(this instanceof BasicGridLayout)) { return new BasicGridLayout(options); }
  options = options || {};
  this.itemWidth = options.itemWidth || 300;
  this.itemHeight = options.itemHeight || 200;
  this.padding = options.padding || 10;
  this.itemsPerRow = options.itemsPerRow || 4;
  options.getRenders = _.bind(this.getRenders, this);
  Layout.call(this, options);
}

inherits(BasicGridLayout, Layout);

_.extend(BasicGridLayout.prototype, {

  getTop: function(options) {
    return Math.floor(options.index / this.itemsPerRow) * (this.itemHeight + this.padding);
  },

  getLeft: function(options) {
    return (options.index % this.itemsPerRow) * (this.itemWidth + this.padding);
  },

  getRenders: function(options) {
    return {
      "cell": {
        transform: {
          top: this.getTop(options),
          left: this.getLeft(options),
          width: this.itemWidth,
          height: this.itemHeight
        },
        animateOptions: {
          duration: 400,
          delay: 40 * options.index
        }
      }
    };
  }
});

module.exports = BasicGridLayout;
