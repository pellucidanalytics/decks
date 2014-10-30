var _ = require("lodash");
//var Hammer = require("../../vendor").Hammer;
var GestureEmitter = require("./gestureemitter");
var DecksEvent = require("../events/decksevent");

function TapEmitter(element, options) {
  if (!(this instanceof TapEmitter)) {
    return new TapEmitter(element, options);
  }

  options = _.merge({}, this.defaultOptions, options);

  GestureEmitter.call(this, element, options);

  this.bindHammerEvents();
}

TapEmitter.prototype = _.create(GestureEmitter.prototype, /** @lends TapEmitter.prototype */ {
  constructor: TapEmitter,

  defaultOptions: _.merge({}, GestureEmitter.prototype.defaultOptions, {
  }),

  getHammerEvents: function() {
    return {
      "tap": "onTap"
    };
  },

  onTap: function(e) {
    this.emit(DecksEvent("gesture:tap", this, e));
  }
});

module.exports = TapEmitter;
