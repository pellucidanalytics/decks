var _ = require("lodash");

/**
 * Utility object for dealing with rectangles.
 *
 * @global
 */
var rect = {
  /**
   * Normalizes an object that has top, bottom, left, and right properties, to a plain
   * object with top, bottom, left, right, width, and height properties.
   *
   * @param {*} r object that has top, bottom, left, right properties.  If r is an Element, r will be the
   * result of r.getBoundingClientRect()
   * @return {undefined}
   */
  normalize: function(r) {
    if (_.isElement(r)) {
      r = r.getBoundingClientRect();
    }
    return {
      top: r.top,
      bottom: r.bottom,
      left: r.left,
      right: r.right,
      width: _.isNumber(r.width) ? r.width : (r.right - r.left),
      height: _.isNumber(r.height) ? r.height : (r.bottom - r.top)
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

  /**
   * Returns a new rectangle which is the union of rectangles r1 and r2
   *
   * @param {*} r1 rectangle 1
   * @param {*} r2 rectangle 2
   * @return {*} New rectangle that is the union of r1 and r2
   */
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

  /**
   * Returns a new rectangle which is the union of all the given rectangles
   *
   * @param {Array} rects
   * @return {*} New rectangle
   */
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

module.exports = rect;
