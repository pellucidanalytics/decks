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
  normalize: function normalize(r) {
    validate(r, "rect#normalize: r (rectangle object)", { isRequired: true });

    if (r.isNormalized) {
      return r;
    }

    if (_.isElement(r)) {
      r = this.getElementRect(r);
    }

    // TODO: should this check for correctness of all values?  E.g. top < bottom, left < right, width === right - left, etc.

    var top = _.isFinite(r.top) ? r.top : 0;
    var bottom = _.isFinite(r.bottom) ? r.bottom : 0;
    var left = _.isFinite(r.left) ? r.left : 0;
    var right = _.isFinite(r.right) ? r.right : 0;
    var width = _.isFinite(r.width) ? r.width : (right - left);
    var height = _.isFinite(r.height) ? r.height : (bottom - top);

    return {
      isNormalized: true,
      top: top,
      bottom: bottom,
      left: left,
      right: right,
      width: width,
      height: height
    };
  },

  /**
   * Gets a bounding client rect for an element, with respect to the document coordinate
   * system (not the window coordinate system).
   *
   * @param {HTMLElement} element - the element for which to find the rect
   * @return {Object} - the calculated rect, with respect to the document coordinate system
   */
  getElementRect: function getElementRect(element) {
    validate(element, "rect#getElementRect: element", { isElement: true });
    return element.getBoundingClientRect();
  },

  /**
   * Indicates if two rects are equal in all dimensions/values.
   *
   * @param r1
   * @param r2
   * @return {undefined}
   */
  isEqual: function isEqual(r1, r2) {
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
   * Indicates if the rect is empty (null, undefined, or or has all values equal to 0)
   *
   * @param r
   * @return {undefined}
   */
  isEmpty: function isEmpty(r) {
    if (_.isNull(r) || _.isUndefined(r)) {
      return true;
    }

    return _.all(["left", "right", "top", "bottom", "width", "height"], function(key) {
      return r[key] === 0;
    });
  },

  /**
   * Indicates whether rectangle r1 intersects rectangle r2
   *
   * @param {*} r1 first rectangle
   * @param {*} r2 second rectangle
   * @return {boolean} true if r1 intersects r2, otherwise false
   */
  intersects: function intersects(r1, r2) {
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
  union: function union(r1, r2) {
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
  unionAll: function unionAll(rects) {
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
   * @param {?number} [height=0] - delta value for height
   * @return {Object} resulting normalized rectangle object
   */
  resize: function resize(r, deltaWidth, deltaHeight) {
    r = this.normalize(r);
    deltaWidth = deltaWidth || 0;
    deltaHeight = deltaHeight || 0;
    return this.normalize({
      left: r.left,
      right: r.right + deltaWidth,
      top: r.top,
      bottom: r.bottom + deltaHeight,
      width: r.width + deltaWidth,
      height: r.height + deltaHeight
    });
  },

  /**
   * Resizes a rect with a delta width (changes width and right)
   *
   * @param r
   * @param deltaWidth
   * @return {undefined}
   */
  resizeWidth: function resizeWidth(r, deltaWidth) {
    return this.resize(r, deltaWidth, 0);
  },

  /**
   * Resizes a rect with a delta height (changes height and bottom)
   *
   * @param r
   * @param deltaHeight
   * @return {undefined}
   */
  resizeHeight: function resizeHeight(r, deltaHeight) {
    return this.resize(r, 0, deltaHeight);
  },

  /**
   * Resizes a rect to an absolute width and height (not delta values)
   *
   * @param r
   * @param width
   * @param height
   * @return {undefined}
   */
  resizeTo: function resizeTo(r, width, height) {
    r = this.normalize(r);
    width = width || r.width;
    height = height || r.height;
    return this.normalize({
      left: r.left,
      right: r.left + width,
      top: r.top,
      bottom: r.top + height,
      width: width,
      height: height
    });
  },

  /**
   * Resizes a rect to an absolute width (not delta value)
   *
   * @param r
   * @param width
   * @return {undefined}
   */
  resizeToWidth: function resizeToWidth(r, width) {
    return this.resizeTo(r, width, null);
  },

  /**
   * Resizes to rect to an absolute height (not delta value)
   *
   * @param r
   * @param height
   * @return {undefined}
   */
  resizeToHeight: function resizeToHeight(r, height) {
    return this.resizeTo(r, null, height);
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
   * @param {?number} [x=0] - delta value for left
   * @param {?number} [y=0] - delta value for top
   * @return {Object} - resulting normalized rectangle object
   */
  move: function move(r, deltaX, deltaY) {
    r = this.normalize(r);
    deltaX = deltaX || 0;
    deltaY = deltaY || 0;
    return this.normalize({
      left: r.left + deltaX,
      right: r.right + deltaX,
      top: r.top + deltaY,
      bottom: r.bottom + deltaY,
      width: r.width,
      height: r.height
    });
  },

  /**
   * Moves a rect by a delta x value.
   *
   * @param r
   * @param deltaX
   * @return {undefined}
   */
  moveX: function moveX(r, deltaX) {
    return this.move(r, deltaX, 0);
  },

  /**
   * Moves a rect by a delta y value.
   *
   * @param r
   * @param deltaY
   * @return {undefined}
   */
  moveY: function moveY(r, deltaY) {
    return this.move(r, 0, deltaY);
  },

  /**
   * Moves a rect to an absolute x and y location.
   *
   * @param r
   * @param x
   * @param y
   * @return {undefined}
   */
  moveTo: function moveTo(r, x, y) {
    r = this.normalize(r);
    x = x || r.left;
    y = y || r.top;
    return this.normalize({
      left: x,
      right: x + r.width,
      top: y,
      bottom: y + r.height,
      width: r.width,
      height: r.height
    });
  },

  /**
   * Moves a rect to an absolute x location.
   *
   * @param r
   * @param x
   * @return {undefined}
   */
  moveToX: function moveToX(r, x) {
    return this.moveTo(r, x, null);
  },

  /**
   * Moves a rect to an absolute y location.
   *
   * @param r
   * @param y
   * @return {undefined}
   */
  moveToY: function moveToY(r, y) {
    return this.moveTo(r, null, y);
  },

  /**
   * Calculates the distance between two points.  Points can be expressed with top and left values,
   * or x and y values.
   *
   * @param {!Object} point1 - first point
   * @param {!Object} point2 - second point
   * @return {number} - the distance between the points
   */
  distance: function distance(point1, point2) {
    var x1 = point1.left || point1.x || 0;
    var y1 = point1.top || point1.y || 0;
    var x2 = point2.left || point2.x || 0;
    var y2 = point2.top || point2.y || 0;
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }
};
