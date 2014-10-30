var _ = require("lodash");
var GestureEmitter = require("./gestureemitter");
var DecksEvent = require("../events/decksevent");

function PressEmitter(element, options) {
  if (!(this instanceof PressEmitter)) {
    return new PressEmitter(element, options);
  }

  options = _.merge({}, this.defaultOptions, options);

  GestureEmitter.call(this, element, options);

  this.bindHammerEvents();
}

PressEmitter.prototype = _.create(GestureEmitter.prototype, /** @lends PressEmitter.prototype */ {
  constructor: PressEmitter,

  defaultOptions: _.merge({}, GestureEmitter.prototype.defaultOptions, {
  }),

  getHammerEvents: function() {
    return {
      "press": "onPress"
    };
  },

  onPress: function(e) {
    this.emit(DecksEvent("gesture:press", this, e));
  }
});

module.exports = PressEmitter;
