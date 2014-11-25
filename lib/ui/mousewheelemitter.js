var _ = require("lodash");
var GestureEmitter = require("./gestureemitter");

/**
 * Class that emits or provides support for mouse wheel events/gestures.
 *
 * TODO: this class is not implemented (not functional)
 *
 * @class
 * @extends GestureEmitter
 * @param {!Object} options - Additional options
 * @param {?(Emitter|Object)} [options.emitter={}] - Emitter instance or options on which to emit events
 * @param {!Element} options.element - Element for which to bind events
 * @param {!Hammer} options.hammer - Hammer instance for the element (required by base class)
 * @param {?boolean} [options.enabled=false] - Whether to enable this emitter
 */
function MouseWheelEmitter(options) {
  if (!(this instanceof MouseWheelEmitter)) {
    return new MouseWheelEmitter(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  GestureEmitter.call(this, options);
}

MouseWheelEmitter.prototype = _.create(GestureEmitter.prototype, /** @lends MouseWheelEmitter.prototype */ {
  constructor: MouseWheelEmitter,

  defaultOptions: _.merge({}, GestureEmitter.prototype.defaultOptions, {
  }),

  getElementEvents: function() {
    return {};
  },

  getHammerEvents: function() {
    return {};
  }
});

module.exports = MouseWheelEmitter;
