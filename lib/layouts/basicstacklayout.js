var _ = require("lodash");
var dom = require("../ui/dom");
var Layout = require("../layout");
var BasicGridLayout = require("./basicgridlayout");

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
  if (!(this instanceof BasicStackLayout)) {
    return new BasicStackLayout(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  this.stacks = [];

  _.each(this.overridables, function(key) {
    if (options[key]) {
      this[key] = options[key];
    }
  }, this);

  BasicGridLayout.call(this, options);
}

BasicStackLayout.prototype = _.create(BasicGridLayout.prototype, /** @lends BasicStackLayout.prototype */ {
  constructor: BasicStackLayout,

  defaultOptions: _.merge({}, BasicGridLayout.prototype.defaultOptions, {
  }),

  getOverridables: function() {
    var overridables = Layout.prototype.getOverridables();
    overridables.push("getStackNames");
    return overridables;
  },

  getStackNames: function(item) {
    var groups = item.get("groups");

    _.each(groups, function(group) {
      if (!_.contains(this.stacks, group)) {
        this.stacks.push(group);
      }
    }, this);

    return groups;
  },

  getStackTop: function(stackName, itemsPerRow, itemPadding) {
    var index = _.indexOf(this.stacks, stackName);
    return this.getTop(index, itemsPerRow, itemPadding);
  },

  getStackLeft: function(stackName, itemsPerRow, itemPadding) {
    var index = _.indexOf(this.stacks, stackName);
    return this.getLeft(index, itemsPerRow, itemPadding);
  },

  getRenders: function(item, options) {
    var stackNames = this.getStackNames(item);
    var width = options.frame.bounds.width;
    var itemsPerRow = this.getItemsPerRow(width);
    this.itemPadding = this.getItemPadding(itemsPerRow, width);

    return _.map(stackNames, function(stackName) {
      return {
        transform: {
          top: this.getStackTop(stackName, itemsPerRow, this.itemPadding) + randomPlusMinus(5),
          left: this.getStackLeft(stackName, itemsPerRow, this.itemPadding) + randomPlusMinus(5),
          rotateZ: 360 - randomPlusMinus(30),
          width: this.itemWidth,
          height: this.itemHeight
        },
        animateOptions: {
          duration: 600
        }
      };
    }, this);
  },

  getCustomRenders: function(options) {
    var element = options.viewport.createCustomRenderElement();
    dom.text(element, "BasicStackLayout");

    return {
      element: element,
      transform: {
        top: 3,
        left: 3,
        zIndex: this.baseZIndex + 100
      },
      animateOptions: {
        duration: 400
      }
    };
  }
});

module.exports = BasicStackLayout;
