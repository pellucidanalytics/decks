var _ = require("lodash");
var BasicGridLayout = require("./BasicGridLayout");

function randomPlusMinus(range) {
  return Math.random() * range - (range / 2);
}

/**
 * Basic stack layout implementation
 *
 * @class
 * @extends BasicGridLayout
 * @param {Object} [options={}] - Additional options
 */
function BasicStackLayout(options) {
  if (!(this instanceof BasicStackLayout)) { return new BasicStackLayout(options); }
  options = options || {};
  this._stacks = [];

  _.each(BasicStackLayout.overridables, function(key) {
    if (options[key]) {
      this[key] = options[key];
    }
  }, this);

  BasicGridLayout.call(this, options);
}

BasicStackLayout.overridables = [
  "getStackNames"
];

BasicStackLayout.prototype = _.create(BasicGridLayout.prototype, /** @lends BasicStackLayout.prototype */ {
  constructor: BasicStackLayout,

  getStackNames: function(item) {
    var groups = item.get("groups");

    _.each(groups, function(group) {
      if (!_.contains(this._stacks, group)) {
        this._stacks.push(group);
      }
    }, this);

    return groups;
  },

  getStackTop: function(stackName, itemsPerRow, itemPadding) {
    var index = _.indexOf(this._stacks, stackName);
    return this.getTop(index, itemsPerRow, itemPadding);
  },

  getStackLeft: function(stackName, itemsPerRow, itemPadding) {
    var index = _.indexOf(this._stacks, stackName);
    return this.getLeft(index, itemsPerRow, itemPadding);
  },

  getRenders: function(item, options) {
    var stackNames = this.getStackNames(item);
    var width = options.frame.bounds.width;
    var itemsPerRow = this.getItemsPerRow(width);
    var itemPadding = this.getItemPadding(itemsPerRow, width);

    return _.map(stackNames, function(stackName) {
      return {
        transform: {
          top: this.getStackTop(stackName, itemsPerRow, itemPadding) + randomPlusMinus(5),
          left: this.getStackLeft(stackName, itemsPerRow, itemPadding) + randomPlusMinus(5),
          rotateZ: 360 - randomPlusMinus(30),
          width: this.itemWidth,
          height: this.itemHeight
        },
        animateOptions: {
          duration: 400,
        }
      };
    }, this);
  }
});

module.exports = BasicStackLayout;
