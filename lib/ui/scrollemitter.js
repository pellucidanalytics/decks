var _ = require("lodash");
var GestureEmitter = require("./gestureemitter");
var DecksEvent = require("../events/decksevent");

function ScrollEmitter(options) {
  if (!(this instanceof ScrollEmitter)) {
    return new ScrollEmitter(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  GestureEmitter.prototype.constructor.call(this, options);

  this.bindElementEvents();
}

ScrollEmitter.prototype = _.create(GestureEmitter.prototype, {
  constructor: ScrollEmitter,

  defaultOptions: _.merge({}, GestureEmitter.prototype.defaultOptions, {
  }),

  getElementEvents: function() {
    return {
      "scroll": "onScroll"
    };
  },

  onScroll: function(e) {
    this.emit(DecksEvent("gesture:scroll", this, e));
  }
});

module.exports = ScrollEmitter;
