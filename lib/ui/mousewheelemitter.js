var _ = require("lodash");
var GestureEmitter = require("./gestureemitter");

// TODO: this class is not functional right now

/**
 * Class that emits or provides support for mouse wheel events/gestures.
 *
 * @class
 * @extends GestureEmitter
 * @param options
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

  // TODO
  getHammerEvents: function() {
    return {};
  }
});

module.exports = MouseWheelEmitter;
