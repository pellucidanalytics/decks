var _ = require("lodash");
var GestureEmitter = require("./gestureemitter");
var DecksEvent = require("../events/decksevent");

/**
 * Class that emits or provides support for mouseover and mouseout events
 *
 * @class
 * @extends GestureEmitter
 * @param {Element} element - element for which to monitor for pan gestures/events.
 * @param {?Object} options - Additional options
 * @param {?boolean} [options.horizontal=false] - Whether to monitor horizontal pan gestures.
 * @param {?boolean} [options.vertical=true] - Whether to monitor vertical pan gestures.
 * @param {?number} [options.threshold=0] - Threshold distance before pan gestures are detected.
 */
function MouseEnterLeaveEmitter(element, options) {
  if (!(this instanceof MouseEnterLeaveEmitter)) {
    return new MouseEnterLeaveEmitter(element, options);
  }

  options = _.merge({}, this.defaultOptions, options);

  GestureEmitter.call(this, element, options);

  this.enter = !!options.enter;
  this.leave = !!options.leave;

  this.bindElementEvents();
}

MouseEnterLeaveEmitter.prototype = _.create(GestureEmitter.prototype, /** @lends MouseEnterLeaveEmitter.prototype */ {
  constructor: MouseEnterLeaveEmitter,

  defaultOptions: _.merge({}, GestureEmitter.prototype.defaultOptions, {
    enter: true,
    out: true
  }),

  getElementEvents: function() {
    var map = {};
    if (this.enter) {
      map.mouseenter = "onMouseEnter";
    }
    if (this.leave) {
      map.mouseleave = "onMouseLeave";
    }
    return map;
  },

  onMouseEnter: function(e) {
    this.emit(DecksEvent("gesture:mouse:enter", this, e));
  },

  onMouseLeave: function(e) {
    this.emit(DecksEvent("gesture:mouse:leave", this, e));
  }
});

module.exports = MouseEnterLeaveEmitter;