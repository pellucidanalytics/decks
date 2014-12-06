var _ = require("lodash");
var dom = require("../ui/dom");
var Layout = require("../layout");

/**
 * Basic row layout implementation
 *
 * @class
 * @extends Layout
 * @param {?Object} options - additional options
 */
function RowLayout(options) {
  if (!(this instanceof RowLayout)) {
    return new RowLayout(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  this.itemWidth = options.itemWidth;
  this.itemHeight = options.itemHeight;
  this.itemsPerRow = options.itemsPerRow;
  this.itemPadding = options.itemPadding;
  this.scrollbarWidth = options.scrollbarWidth;
  this.transform = options.transform;
  this.animateOptions = options.animateOptions;

  Layout.call(this, options);
}

RowLayout.prototype = _.create(Layout.prototype, /** @lends RowLayout.prototype */ {
  constructor: RowLayout,

  defaultOptions: _.merge({}, Layout.prototype.defaultOptions, {
    itemWidth: 300,
    itemHeight: 200,
    itemsPerRow: 20,
    scrollbarWidth: 20,
    transform: {},
    animateOptions: {}
  }),

  getItemsPerRow: function() {
    return this.itemsPerRow;
  },

  getItemPadding: function() {
    return this.itemPadding;
  },

  getTop: function(index, itemsPerRow, itemPadding) {
    var row = Math.floor(index / itemsPerRow);
    return row * (this.itemHeight + itemPadding) + itemPadding;
  },

  getLeft: function(index, itemsPerRow, itemPadding) {
    var column = index % itemsPerRow;
    return column * (this.itemWidth + itemPadding) + itemPadding;
  },

  getTransform: function(item/*, options*/) {
    var index = item.index;
    var itemsPerRow = this.getItemsPerRow();
    var itemPadding = this.getItemPadding();

    return _.merge({}, this.transform, {
      top: this.getTop(index, itemsPerRow, itemPadding),
      left: this.getLeft(index, itemsPerRow, itemPadding),
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

    var gestureGroup = "" + Math.floor(item.index / this.getItemsPerRow());

    return _.merge(this.getShowAnimation(), {
      transform: this.getTransform(item, options),
      animateOptions: this.getAnimateOptions(item),
      gestureHandlerGroupId: gestureGroup
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

    var itemsPerRow = this.getItemsPerRow();
    var rowCount = Math.ceil(itemCount / itemsPerRow);
    var itemPadding = this.getItemPadding();

    var labelElement = options.viewport.createCustomRenderElement();
    dom.text(labelElement, "RowLayout");

    var renders = [
      {
        element: labelElement,
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
      var dividerElement = options.viewport.createCustomRenderElement();
      var hr = dom.create("hr");
      hr.style.margin = 0;
      dom.append(dividerElement, hr);
      var top = (this.itemHeight + itemPadding) * (rowIndex + 1) + 0.5 * itemPadding;

      renders.push({
        element: dividerElement,
        transform: {
          top: [top, top],
          width: "100%",
          margin: 0
        },
        animateOptions: {
          duration: 600
        }
      });
    }, this);

    return renders;
  },

  getRenderGestureOptions: function() {
    return {
      gestures: {
        pan: {
          enabled: true,
          horizontal: true,
          vertical: false
        },
        swipe: {
          enabled: true,
          horizontal: true,
          vertical: false
        }
      }
    };
  },

  getCanvasGestureOptions: function() {
    return {
      gestures: {
        tap: {
          enabled: true
        },
        press: {
          enabled: true
        },
        pan: {
          vertical: true,
          horizontal: false
        },
        swipe: {
          vertical: true,
          horizontal: false
        }
      },
      snapping: {
        toBounds: false,
        toNearestChildElement: false
      }
    };
  },

  getCanvasBoundsOptions: function() {
    var options = Layout.prototype.getCanvasBoundsOptions();
    options.preventOverflowHorizontal = true;
    options.preventScrollbarHorizontal = true;
    return options;
  }
});

module.exports = RowLayout;
