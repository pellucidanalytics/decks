var _ = require("lodash");

/**
 * Utility object for dealing with rectangles.
 *
 * @global
 */
var rectangles = {
  normalize: function(r) {
    if (_.isElement(r)) {
      r = r.getBoundingClientRect();
    }
    return {
      top: r.top,
      bottom: r.bottom,
      left: r.left,
      right: r.right,
      width: r.width || (r.right - r.left),
      height: r.height || (r.bottom - r.top)
    };
  },

  /**
   * Indicates whether rectangle r1 intersects rectangle r2
   *
   * @param {*} r1 first rectangle
   * @param {*} r2 second rectangle
   * @return {boolean} true if r1 intersects r2, otherwise false
   */
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
    return this.normalize({
      top: Math.min(r1.top, r2.top),
      bottom: Math.max(r1.bottom, r2.bottom),
      left: Math.min(r1.left, r2.left),
      right: Math.max(r1.right, r2.right)
    });
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
