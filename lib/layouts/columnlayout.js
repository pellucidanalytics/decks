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
function ColumnLayout(options) {
  if (!(this instanceof ColumnLayout)) {
    return new ColumnLayout(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  this.itemWidth = options.itemWidth;
  this.itemHeight = options.itemHeight;
  this.itemsPerColumn = options.itemsPerColumn;
  this.itemPadding = options.itemPadding;
  this.scrollbarWidth = options.scrollbarWidth;
  this.transform = options.transform;
  this.animateOptions = options.animateOptions;

  Layout.call(this, options);
}

ColumnLayout.prototype = _.create(Layout.prototype, /** @lends ColumnLayout.prototype */ {
  constructor: ColumnLayout,

  defaultOptions: _.merge({}, Layout.prototype.defaultOptions, {
    itemWidth: 300,
    itemHeight: 200,
    itemsPerColumn: 20,
    itemPadding: 40,
    scrollbarWidth: 20,
    transform: {},
    animateOptions: {}
  }),

  getItemsPerColumn: function() {
    return this.itemsPerColumn;
  },

  getItemPadding: function() {
    return this.itemPadding;
  },

  getTop: function(index, itemsPerColumn, itemPadding) {
    var row = index % itemsPerColumn;
    return row * (this.itemHeight + itemPadding) + itemPadding;
  },

  getLeft: function(index, itemsPerColumn, itemPadding) {
    var column = Math.floor(index / itemsPerColumn);
    return column * (this.itemWidth + itemPadding) + itemPadding;
  },

  getTransform: function(item/*, options*/) {
    var index = item.index;
    var itemsPerColumn = this.getItemsPerColumn();
    var itemPadding = this.getItemPadding();

    return _.merge({}, this.transform, {
      top: this.getTop(index, itemsPerColumn, itemPadding),
      left: this.getLeft(index, itemsPerColumn, itemPadding),
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

    var gestureGroup = "" + Math.floor(item.index / this.getItemsPerColumn());

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
    var labelElement = options.viewport.createCustomRenderElement();
    dom.text(labelElement, "ColumnLayout");

    return {
      element: labelElement,
      transform: {
        top: 3,
        left: 3,
        zIndex: this.baseZIndex + 100
      },
      animateOptions: {
        duration: 400
      }
    };
  },

  getRenderGestureOptions: function() {
    return {
      gestures: {
        pan: {
          enabled: true,
          horizontal: false,
          vertical: true
        },
        swipe: {
          enabled: true,
          horizontal: false,
          vertical: true
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
          vertical: false,
          horizontal: true
        },
        swipe: {
          vertical: false,
          horizontal: true
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
    options.preventOverflowVertical = true;
    options.preventScrollbarVertical = true;
    return options;
  }
});

module.exports = ColumnLayout;
