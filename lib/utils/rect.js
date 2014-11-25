var _ = require("lodash");
var validate = require("./validate");

/**
 * Utility module for dealing with rectangles.
 *
 * @module decks/utils/rect
 */
module.exports = {
  /**
   * Normalizes an object that has top, bottom, left, and right properties, to a plain
   * object with top, bottom, left, right, width, and height properties.
   *
   * @param {*} r object that has top, bottom, left, right properties.  If r is an Element, r will be the
   * result of r.getBoundingClientRect()
   * @return {undefined}
   */
  normalize: function(r) {
    validate(r, "rect#normalize: r (rectangle object)", { isRequired: true });

    if (r.isNormalized) {
      return r;
    }

    if (_.isElement(r)) {
      r = this.getElementRect(r);
    }

    return {
      isNormalized: true,
      top: r.top,
      bottom: r.bottom,
      left: r.left,
      right: r.right,
      width: r.width || (r.right - r.left),
      height: r.height || (r.bottom - r.top)
    };
  },

  /**
   * Gets a bounding client rect for an element, with respect to the document coordinate
   * system (not the window coordinate system).
   *
   * @param {HTMLElement} element - the element for which to find the rect
   * @return {Object} - the calculated rect, with respect to the document coordinate system
   */
  getElementRect: function(element) {
    validate(element, "rect#getElementRect: element", { isElement: true });
    return element.getBoundingClientRect();
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
   * Indicates if two rects are equal in all dimensions/values.
   *
   * @param r1
   * @param r2
   * @return {undefined}
   */
  isEqual: function(r1, r2) {
    if (!r1 && !r2) {
      return true;
    }
    if (!r1 || !r2) {
      return false;
    }
    r1 = this.normalize(r1);
    r2 = this.normalize(r2);
    return _.isEqual(r1, r2);
  },

  /**
   * Returns a new rectangle which is the union of all the given rectangles
   *
   * @param {Array} rects
   * @return {*} New rectangle
   */
  unionAll: function(rects) {
    validate(rects, "rect#unionAll: rects", { isArray: true });

    // Initial accumulator allows the first rectangle to win the union
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

  /**
   * Resizes a rect by adding the specified width and height values, and adjusting
   * the right and bottom dimensions, based on the current top/left and new width/height.
   *
   * Use negative width and height to shrink the rect.
   *
   * This does not change top and left.
   *
   * @param {!Object} r - rectangle-like object
   * @param {?number} [width=0] - delta value for width
   * @param {?height} [height=0] - delta value for height
   * @return {Object} resulting normalized rectangle object
   */
  resize: function(r, width, height) {
    r = this.normalize(r);
    width = width || 0;
    height = height || 0;
    r.right = r.left + width;
    r.bottom = r.top + height;
    r.width = width;
    r.height = height;
    return r;
  },

  /**
   * Moves a rect by adding the specified x and y values to left and top.
   *
   * The width and height are not changed, but the right and bottom values are changed based
   * on the new left/top and current width/height.
   *
   * This does not change width and height;
   *
   * @param {!Object} r - rectangle-like object
   * @param {?number} [left=0] - delta value for left
   * @param {?number} [top=0] - delta value for top
   * @return {Object} - resulting normalized rectangle object
   */
  move: function(r, left, top) {
    r = this.normalize(r);
    left = left || 0;
    top = top || 0;
    r.left = r.left + left;
    r.right = r.left + r.width;
    r.top = r.top + top;
    r.bottom = r.top + r.height;
    return r;
  },

  /**
   * Calculates the distance between two points.  Points can be expressed with top and left values,
   * or x and y values.
   *
   * @param {!Object} point1 - first point
   * @param {!Object} point2 - second point
   * @return {number} - the distance between the points
   */
  distance: function(point1, point2) {
    var x1 = point1.left || point1.x || 0;
    var y1 = point1.top || point1.y || 0;
    var x2 = point2.left || point2.x || 0;
    var y2 = point2.top || point2.y || 0;
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }
};
