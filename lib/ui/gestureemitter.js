var _ = require("lodash");
var binder = require("../events").binder;

/**
 * Base class for gesture emitters
 *
 * @class
 * @abstract
 * @mixes binder
 * @param {!Element} element - element for which to add gesture support
 * @param {!Object} options - gesture configuration options
 */
function GestureEmitter(element, options) {
  if (!(this instanceof GestureEmitter)) { return new GestureEmitter(element, options); }
  if (!element) { throw new Error("element is required"); }
  if (!options.hammer) { throw new Error("options.hammer is required"); }
  this.element = element;
  this.hammer = options.hammer;
}

_.extend(GestureEmitter.prototype, binder, /** @lends GestureEmitter.prototype */ {
  getHammerEvents: function() {
    throw new Error("getHammerEvents is abstract");
  },

  bindHammerEvents: function() {
    this.bindEvents(this.hammer, this.getHammerEvents());
  },

  unbindHammerEvents: function() {
    this.unbindEvents(this.hammer, this.getHammerEvents());
  },

  destroy: function() {
    this.unbindHammerEvents();
  }
});

module.exports = GestureEmitter;
