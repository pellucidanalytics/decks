var _ = require("lodash");

/**
 * Utility object for dealing with rectangles.
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
    if (!r) {
      throw new Error("rect.normalize: r is required");
    }

    if (_.isElement(r)) {
      r = this.getElementRect(r);
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
   * Gets a bounding client rect for an element, with respect to the document coordinate
   * system (not the window coordinate system).
   *
   * @param {HTMLElement} element - the element for which to find the rect
   * @return {Object} - the calculated rect, with respect to the document coordinate system
   */
  getElementRect: function(element) {
    if (!_.isElement(element)) {
      throw new Error("rect.getElementRect: element is required and must be an Element");
    }

    return element.getBoundingClientRect();

    /*
    var clientRect = element.getBoundingClientRect();
    var body = document.body;
    var documentElement = document.documentElement;

    var scrollTop = window.pageYOffset || documentElement.scrollTop || body.scrollTop;
    var scrollLeft = window.pageXOffset || documentElement.scrollLeft || body.scrollLeft;

    var clientTop = documentElement.clientTop || body.clientTop || 0;
    var clientLeft = documentElement.clientLeft || body.clientLeft || 0;

    return this.normalize({
      top: clientRect.top + scrollTop - clientTop,
      bottom: clientRect.bottom + scrollTop - clientTop,
      left: clientRect.left + scrollLeft - clientLeft,
      right: clientRect.right + scrollLeft - clientLeft
    });
    */
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
    if (!_.isArray(rects)) {
      throw new Error("rect.unionAll: rects is required and must be an Array");
    }

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

  subtract: function(r1, r2) {
    r1 = this.normalize(r1);
    r2 = this.normalize(r2);

    return {
      left: r1.left - r2.left,
      right: r1.right - r2.right,
      top: r1.top - r2.top,
      bottom: r1.bottom - r2.bottom,
      width: r1.width - r2.width,
      height: r1.height - r2.height
    };
  },

  grow: function(r, sizes) {
    r = this.normalize(r);
    return this.normalize({
      top: r.top - sizes.top,
      bottom: r.bottom + sizes.bottom,
      left: r.left - sizes.left,
      right: r.right + sizes.right
    });
  }
};

module.exports = rect;
