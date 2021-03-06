var _ = require("lodash");
var Layout = require("../layout");


/**
 * Basic zoomed-in layout implementation
 *
 * @class
 * @extends Layout
 * @param {?Object} options - options
 */
function ZoomLayout(options) {
  if (!(this instanceof ZoomLayout)) {
    return new ZoomLayout(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  this.horizontal = options.horizontal;
  this.vertical = options.vertical;
  if (this.horizontal && this.vertical) {
    throw new Error("ZoomLayout#constructor: cannot be both horizontal and vertical");
  }
  if (!this.horizontal && !this.vertical) {
    this.horizontal = true; // default to horizontal
  }
  this.padding = options.padding || 10;

  Layout.call(this, options);
}

ZoomLayout.prototype = _.create(Layout.prototype, /** @lends ZoomLayout.prototype */ {
  constructor: ZoomLayout,

  defaultOptions: _.merge({}, Layout.prototype.defaultOptions, {
    horizontal: true,
    vertical: false
  }),

  getRenders: function(item, options) {
    var width = options.frame.bounds.width - (2 * this.padding) - 20;
    var height = options.frame.bounds.height - (2 * this.padding) - 20;

    return {
      transform: this.getTransform(item, width, height),
      animateOptions: this.getAnimateOptions()
    };
  },

  getTransform: function(item, width, height) {
    var transform = {
      width: width,
      height: height,
      rotateZ: 0
    };

    if (this.horizontal) {
      transform.top = this.padding;
      transform.left = item.index * (this.padding + width) + this.padding;
    } else if (this.vertical) {
      transform.top = item.index * (this.padding + height) + this.padding;
      transform.left = this.padding;
    }

    return transform;
  },

  getAnimateOptions: function() {
    return {
      duration: 600
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
          horizontal: this.horizontal,
          vertical: this.vertical
        },
        swipe: {
          horizontal: this.horizontal,
          vertical: this.vertical
        },
        mouseWheel: {
          horizontal: this.horizontal,
          vertical: this.vertical
        },
        scroll: {
          enabled: true
        }
      },
      snapping: {
        toNearestChildElement: true
      }
    };
  },

  getCanvasBoundsOptions: function() {
    var options = Layout.prototype.getCanvasBoundsOptions();
    options.marginRight = 40;
    options.preventOverflowVertical = true;
    options.preventScrollbarVertical = true;
    return options;
  },

  getMoveToElementOffsets: function(/*element*/) {
    return {
      x: -this.padding,
      y: -this.padding
    };
  }
});

module.exports = ZoomLayout;
