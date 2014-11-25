var _ = require("lodash");
var dom = require("../ui/dom");
var Layout = require("../layout");

/**
 * Basic grid layout implementation
 *
 * @class
 * @extends Layout
 * @param {?Object} options - additional options
 */
function BasicGridLayout(options) {
  if (!(this instanceof BasicGridLayout)) {
    return new BasicGridLayout(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  this.itemWidth = options.itemWidth;
  this.itemHeight = options.itemHeight;
  this.scrollbarWidth = options.scrollbarWidth;
  this.transform = options.transform;
  this.animateOptions = options.animateOptions;

  Layout.call(this, options);
}

BasicGridLayout.prototype = _.create(Layout.prototype, /** @lends BasicGridLayout.prototype */ {
  constructor: BasicGridLayout,

  defaultOptions: _.merge({}, Layout.prototype.defaultOptions, {
    itemWidth: 300,
    itemHeight: 200,
    scrollbarWidth: 20,
    transform: {},
    animateOptions: {}
  }),

  getItemsPerRow: function(width) {
    return Math.floor(width / this.itemWidth) - 2;
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
    this.itemPadding = this.getItemPadding(itemsPerRow, width);

    return _.merge({}, this.transform, {
      top: this.getTop(index, itemsPerRow, this.itemPadding),
      left: this.getLeft(index, itemsPerRow, this.itemPadding),
      width: this.itemWidth,
      height: this.itemHeight
    });
  },

  getAnimateOptions: function(/* item */) {
    return _.merge({
      duration: 600
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
  },

  getMoveToElementOffsets: function(/*element*/) {
    return {
      x: -this.itemPadding,
      y: -this.itemPadding
    };
  },

  getCustomRenders: function(options) {
    var itemCount = options.itemCollection.getItems(function(item) {
      return item.index !== -1;
    }).length;
    var itemsPerRow = this.getItemsPerRow(options.frame.bounds.width);
    var rowCount = Math.ceil(itemCount / itemsPerRow);
    var itemPadding = this.getItemPadding(itemsPerRow, options.frame.bounds.width);

    var element = options.viewport.createCustomRenderElement();
    dom.text(element, "BasicGridLayout");

    var renders = [
      {
        element: element,
        transform: {
          top: 3,
          left: 3,
          zIndex: this.baseZIndex + 100
        },
        animateOptions: {
          duration: 400
        }
      }
    ];

    _.each(_.range(rowCount), function(rowIndex) {
      var element = options.viewport.createCustomRenderElement();
      var hr = dom.create("hr");
      hr.style.margin = 0;
      dom.append(element, hr);
      var top = (this.itemHeight + itemPadding) * (rowIndex + 1) + 0.5 * itemPadding;

      renders.push({
        element: element,
        transform: {
          top: [top, top],
          width: "100%",
          margin: 0
        },
        animateOptions: {
          duration: 400
        }
      });
    }, this);

    return renders;
  }
});

module.exports = BasicGridLayout;
