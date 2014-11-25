var _ = require("lodash");
var GestureEmitter = require("./gestureemitter");
var DecksEvent = require("../events/decksevent");

/**
 * Class that emits or provides support for mouseover and mouseout events on an element
 *
 * @class
 * @extends GestureEmitter
 * @param {Element} element - element for which to monitor for pan gestures/events.
 * @param {?Object} options - Additional options
 * @param {?boolean} [options.horizontal=false] - Whether to monitor horizontal pan gestures.
 * @param {?boolean} [options.vertical=true] - Whether to monitor vertical pan gestures.
 * @param {?number} [options.threshold=0] - Threshold distance before pan gestures are detected.
 */
function MouseOverOutEmitter(options) {
  if (!(this instanceof MouseOverOutEmitter)) {
    return new MouseOverOutEmitter(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  GestureEmitter.call(this, options);

  this.over = !!options.over;
  this.out = !!options.out;

  this.bindElementEvents();
}

MouseOverOutEmitter.prototype = _.create(GestureEmitter.prototype, /** @lends MouseOverOutEmitter.prototype */ {
  constructor: MouseOverOutEmitter,

  defaultOptions: _.merge({}, GestureEmitter.prototype.defaultOptions, {
    over: true,
    out: true
  }),

  getElementEvents: function() {
    var map = {};
    if (this.over) {
      map.mouseover = "onMouseOver";
    }
    if (this.out) {
      map.mouseout = "onMouseOut";
    }
    return map;
  },

  onMouseOver: function(e) {
    this.emit(DecksEvent("gesture:mouse:over", this, e));
  },

  onMouseOut: function(e) {
    this.emit(DecksEvent("gesture:mouse:out", this, e));
  }
});

module.exports = MouseOverOutEmitter;
