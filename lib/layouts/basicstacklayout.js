var _ = require("lodash");
var BasicGridLayout = require("./BasicGridLayout");
var inherits = require("inherits");

function randomPlusMinus(range) {
  return Math.random() * range - (range / 2);
}

function BasicStackLayout(options) {
  if (!(this instanceof BasicStackLayout)) { return new BasicStackLayout(options); }
  options = options || {};

  this.stacks = [];

  options.getRenders = _.bind(this.getRenders, this);
  BasicGridLayout.call(this, options);
}

inherits(BasicStackLayout, BasicGridLayout);

_.extend(BasicStackLayout.prototype, {

  getStackName: function(options) {
    var stackName = "stack" + options.index % 5;

    if (!_.contains(this.stacks, stackName)) {
      this.stacks.push(stackName);
    }

    return stackName;
  },

  getStackTop: function(stackName) {
    console.log(this.stacks, stackName);
    var index = _.indexOf(this.stacks, stackName);
    var top = Math.floor(index / this.itemsPerRow) * (this.itemHeight + this.itemPadding);
    console.log(index, top);
    return top;
  },

  getStackLeft: function(stackName) {
    var index = _.indexOf(this.stacks, stackName);
    return (index % this.itemsPerRow) * (this.itemWidth + this.itemPadding);
  },

  getRenders: function(options) {
    var stackName = this.getStackName(options);

    var renders = {};

    renders[stackName] = {
      transform: {
        top: this.getStackTop(stackName) + randomPlusMinus(5),
        left: this.getStackLeft(stackName) + randomPlusMinus(5),
        rotateZ: 360 - randomPlusMinus(30),
        width: this.itemWidth,
        height: this.itemHeight
      },
      animateOptions: {
        duration: 400,
        delay: 40 * options.index
      }
    };

    return renders;
  }
});

module.exports = BasicStackLayout;
