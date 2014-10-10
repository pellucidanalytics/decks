var _ = require("lodash");
var services = require("../services");
var dom = require("./dom");
var binder = require("../events").binder;
var rect = require("../utils").rect;

/**
 * Base class for gesture handlers
 *
 * @class
 * @abstract
 * @mixes binder
 * @param {!Element} element - element for which to add gesture support
 * @param {!Object} options - gesture configuration options
 */
function Gesturable(element, options) {
  if (!(this instanceof Gesturable)) { return new Gesturable(element, options); }

  this.setElement(element);
  this.setOptions(options);

  this.bindEvents(this.hammer, this.getHammerEvents());
}

_.extend(Gesturable.prototype, binder, /** @lends Gesturable.prototype */ {

  defaultOptions: {
    horizontal: true,
    vertical: true,
    snapAnimateOptions: {
      duration: 200,
      easing: [200, 15]
    },
    inertiaAnimateOptions: {
    },
    bounds: null
  },

  setElement: function(element) {
    if (!element) { throw new Error("element is required"); }
    this.element = element;
  },

  setOptions: function(options) {
    if (!options) { throw new Error("options is required"); }
    if (!options.hammer) { throw new Error("options.hammer is required"); }
    options = _.merge({}, this.defaultOptions, options);

    this.horizontal = !!options.horizontal;
    this.vertical = !!options.vertical;
    this.snapAnimateOptions = options.snapAnimateOptions;
    this.inertiaAnimateOptions = options.inertiaAnimateOptions;
    this.hammer = options.hammer;
    this.bounds = options.bounds;
  },

  destroy: function() {
    this.unbindEvents(this.hammer, this.getHammerEvents());
  },

  setStart: function(e) {
    this.start = {
      event: e,
      x: dom.getStyle(this.element, "left", { parseInt: true }),
      y: dom.getStyle(this.element, "top", { parseInt: true })
    };
  },

  move: function(e, elementRect) {
    elementRect = elementRect || rect.normalize(this.element);
    this.moveX(e);
    this.moveY(e);
  },

  moveX: function(e, elementRect) {
    elementRect = elementRect || rect.normalize(this.element);
    var x = this.start.x + e.deltaX;

    var distance;
    var k = 0.7;

    if (elementRect.left > this.bounds.left) {
      distance = elementRect.left - this.bounds.left;
      if (distance > 40) {
        x -= Math.round(k * distance);
      }
    } else if (elementRect.right < this.bounds.right) {
      distance = this.bounds.right - elementRect.right;
      if (distance > 40) {
        x += Math.round(k * distance);
      }
    }

    dom.setStyle(this.element, "left", x);
  },

  moveY: function(e, elementRect) {
    elementRect = elementRect || rect.normalize(this.element);
    var y = this.start.y + e.deltaY;

    var distance;
    var k = 0.7;

    if (elementRect.top > this.bounds.top) {
      distance = elementRect.top - this.bounds.top;
      if (distance > 40) {
        y -= Math.round(k * distance);
      }
    } else if (elementRect.bottom < this.bounds.bottom) {
      distance = this.bounds.bottom - elementRect.bottom;
      if (distance > 40) {
        y += Math.round(k * distance);
      }
    }

    dom.setStyle(this.element, "top", y);
  },

  moveWithInertia: function(e) {
    this.moveWithInertiaX(e);
    this.moveWithInertiaY(e);
  },

  moveWithInertiaX: function(e) {
    console.log(e);
  },

  moveWithInertiaY: function(e) {
    console.log(e);
  },

  snapToBounds: function() {
    if (!this.bounds) {
      return;
    }

    var elementRect = rect.normalize(this.element);
    var transform = {};

    if (elementRect.top > this.bounds.top) {
      transform.top = 0;
    } else if (elementRect.bottom < this.bounds.bottom) {
      transform.top = "+=" + (this.bounds.bottom - elementRect.bottom);
    }

    if (elementRect.left > this.bounds.left) {
      transform.left = 0;
    } else if (elementRect.right < this.bounds.right) {
      transform.left = "+=" + (this.bounds.right - elementRect.right);
    }

    services.animator.animate(this.element, transform, this.snapAnimateOptions);
  }
});

module.exports = Gesturable;
