var _ = require("lodash");
var GestureEmitter = require("./gestureemitter");
var DecksEvent = require("../events/decksevent");

/**
 * Class that emits or provides support for mouseover and mouseout events
 *
 * @class
 * @extends GestureEmitter
 * @param {!Object} options - Additional options
 * @param {?(Emitter|Object)} [options.emitter={}] - Emitter instance or options on which to emit events
 * @param {!Element} options.element - Element for which to bind events
 * @param {!Hammer} options.hammer - Hammer instance for the element (required by base class)
 * @param {?boolean} [options.enabled=false] - Whether to enable this emitter
 * @param {?boolean} [options.horizontal=false] - Whether to monitor horizontal pan gestures.
 * @param {?boolean} [options.vertical=true] - Whether to monitor vertical pan gestures.
 * @param {?number} [options.threshold=0] - Threshold distance before pan gestures are detected.
 */
function MouseEnterLeaveEmitter(options) {
  if (!(this instanceof MouseEnterLeaveEmitter)) {
    return new MouseEnterLeaveEmitter(options);
  }

  options = _.merge({}, this.defaultOptions, options);
  GestureEmitter.call(this, options);

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
