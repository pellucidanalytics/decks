var _ = require("lodash");
var inherits = require("inherits");
var GestureEmitter = require("./gestureemitter");

function MouseWheelEmitter(element, options) {
  if (!(this instanceof MouseWheelEmitter)) { return new MouseWheelEmitter(element, options); }
  GestureEmitter.call(this, element, options);
}

inherits(MouseWheelEmitter, GestureEmitter);

_.extend(MouseWheelEmitter.prototype, {
  getHammerEvents: function() {
    return {};
  }
});

module.exports = MouseWheelEmitter;
