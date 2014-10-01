var _ = require("lodash");
var Layout = require("../Layout");
var inherits = require("inherits");

function BasicGridLayout(options) {
  if (!(this instanceof BasicGridLayout)) { return new BasicGridLayout(options); }
  this.itemWidth = options.itemWidth || 300;
  this.itemHeight = options.itemHeight || 200;
  options.getRenders = _.bind(this.getRenders, this);
  Layout.call(this, options);
}

inherits(BasicGridLayout, Layout);

_.extend(BasicGridLayout.prototype, {

  getRow: function(options) {
  },

  getColumn: function(options) {
  },

  getRenders: function(options) {
    return {
      transforms: {

      }
    };
  }
});

module.exports = BasicGridLayout;
