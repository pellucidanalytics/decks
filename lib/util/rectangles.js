var _ = require("lodash");

var rectangles = {
  normalize: function(rectangle) {
    var result = {};

    if (_.isElement(rectangle)) {
      rectangle = rectangle.getBoundingClientRect();
    }

    result.top = rectangle.top;
    result.bottom = rectangle.bottom;
    result.left = rectangle.left;
    result.right = rectangle.right;
    result.width = rectangle.width || (rectangle.right - rectangle.left);
    result.height = rectangle.height || (rectangle.bottom - rectangle.top);

    return result;
  },

  intersects: function(r1, r2) {
    r1 = this.normalize(r1);
    r2 = this.normalize(r2);

    return !(r2.left > r1.right ||
      r2.right < r1.left ||
      r2.top > r1.bottom ||
      r2.bottom < r1.top);
  },

  union: function(r1, r2) {
    r1 = this.normalize(r1);
    r2 = this.normalize(r2);
    var result = {
      top: Math.min(r1.top, r2.top),
      bottom: Math.max(r1.bottom, r2.bottom),
      left: Math.min(r1.left, r2.left),
      right: Math.max(r1.right, r2.right)
    };
    return this.normalize(result);
  },

  unionAll: function(rects) {
    var acc = {
      top: Infinity,
      bottom: -Infinity,
      left: Infinity,
      right: -Infinity
    };
    return _.reduce(rects, function(acc, rect) {
      return this.union(acc, rect);
    }, acc, this);
  },

  grow: function(rectangle, amount) {
    rectangle = this.normalize(rectangle);
    var result = {
      top: rectangle.top - amount,
      bottom: rectangle.bottom + amount,
      left: rectangle.left - amount,
      right: rectangle.right + amount
    };
    return this.normalize(result);
  }
};

module.exports = rectangles;
