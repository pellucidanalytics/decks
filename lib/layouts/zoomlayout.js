var _ = require("lodash");
var Layout = require("../layout");

function ZoomLayout(options) {
  if (!(this instanceof ZoomLayout)) { return new ZoomLayout(options); }
  this.horizontal = !!options.horizontal;
  this.vertical = !!options.vertical;
  if (!this.horizontal && !this.vertical) {
    this.horizontal = true; // default to horizontal
  }
  this.padding = options.padding || 10;
  Layout.call(this, options);
}

ZoomLayout.prototype = _.create(Layout.prototype, {
  constructor: ZoomLayout,

  getRenders: function(item, options) {
    var width = options.frame.bounds.width - (2 * this.padding);
    var height = options.frame.bounds.height - (2 * this.padding);

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
      duration: 400
    };
  },

  getCanvasGestureOptions: function() {
    return {
      gestures: {
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
        }
      }
    };
  }
});

module.exports = ZoomLayout;
