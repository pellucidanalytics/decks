var _ = require("lodash");
var GestureEmitter = require("./gestureemitter");

function MouseWheelEmitter(element, options) {
  if (!(this instanceof MouseWheelEmitter)) {
    return new MouseWheelEmitter(element, options);
  }

  options = _.merge({}, this.defaultOptions, options);

  GestureEmitter.call(this, element, options);
}

MouseWheelEmitter.prototype = _.create(GestureEmitter.prototype, /** @lends MouseWheelEmitter.prototype */ {
  constructor: MouseWheelEmitter,

  defaultOptions: _.merge({}, GestureEmitter.prototype.defaultOptions, {
  }),

  getHammerEvents: function() {
    return {};
  }
});

module.exports = MouseWheelEmitter;
