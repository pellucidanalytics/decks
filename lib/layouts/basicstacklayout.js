var _ = require("lodash");
var BasicGridLayout = require("./BasicGridLayout");
var inherits = require("inherits");

function randomPlusMinus(range) {
  return Math.random() * range - (range / 2);
}

/**
 * Basic stack layout implementation
 *
 * @constructor
 * @augments BasicGridLayout
 * @param {?Object} options additional options
 */
function BasicStackLayout(options) {
  if (!(this instanceof BasicStackLayout)) { return new BasicStackLayout(options); }
  options = options || {};
  this.stacks = [];
  BasicGridLayout.call(this, options);
}

inherits(BasicStackLayout, BasicGridLayout);

_.extend(BasicStackLayout.prototype, /** @lends BasicStackLayout.prototype */ {

  getStackName: function(options) {
    var stackName = "stack" + options.index % 5;
    if (!_.contains(this.stacks, stackName)) {
      this.stacks.push(stackName);
    }
    return stackName;
  },

  getStackTop: function(stackName) {
    var index = _.indexOf(this.stacks, stackName);
    return this.getTop(index);
  },

  getStackLeft: function(stackName) {
    var index = _.indexOf(this.stacks, stackName);
    return this.getLeft(index);
  },

  getRenders: function(options) {
    var stackName = this.getStackName(options);

    return [
      {
        transform: {
          top: this.getStackTop(stackName) + randomPlusMinus(5),
          left: this.getStackLeft(stackName) + randomPlusMinus(5),
          rotateZ: 360 - randomPlusMinus(30),
          width: this.itemWidth,
          height: this.itemHeight
        },
        animateOptions: {
          duration: 400,
        }
      }
    ];
  }
});

module.exports = BasicStackLayout;
