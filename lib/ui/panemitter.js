var _ = require("lodash");
var Hammer = require("../../vendor").Hammer;
var GestureEmitter = require("./gestureemitter");
var DecksEvent = require("../events/decksevent");

function PanEmitter(element, options) {
  if (!(this instanceof PanEmitter)) { return new PanEmitter(element, options); }
  options = _.merge({}, this.defaultOptions, options);

  GestureEmitter.call(this, element, options);

  this.horizontal = !!options.horizontal;
  this.vertical = !!options.vertical;
  this.threshold = options.threshold || 0;
  if (options.horizontal && options.vertical) {
    this.direction = Hammer.DIRECTION_ALL;
  } else if (options.horizontal) {
    this.direction = Hammer.DIRECTION_HORIZONTAL;
  } else {
    this.direction = Hammer.DIRECTION_VERTICAL;
  }

  this.hammer.get("pan").set({
    direction: this.direction,
    threshold: this.threshold
  });

  this.bindHammerEvents();
}

PanEmitter.prototype = _.create(GestureEmitter.prototype, /** @lends PanEmitter.prototype */ {
  constructor: PanEmitter,

  defaultOptions: _.merge({}, GestureEmitter.prototype.defaultOptions, {
    horizontal: false,
    vertical: true,
    threshold: 0
  }),

  getHammerEvents: function() {
    var map = {
      "panstart": "onPanStart",
      "panend": "onPanEnd",
      "pancancel": "onPanCancel"
    };
    if (this.horizontal && this.vertical) {
      _.extend(map, {
        "panmove": "onPanMove"
      });
    } else if (this.horizontal) {
      _.extend(map, {
        "panleft panright": "onPanX"
      });
    } else if (this.vertical) {
      _.extend(map, {
        "panup pandown": "onPanY"
      });
    }
    return map;
  },

  onPanStart: function(e) {
    this.emit(DecksEvent("gesture:pan:start", this, e));
  },

  onPanMove: function(e) {
    this.emit(DecksEvent("gesture:pan:any", this, e));
  },

  onPanX: function(e) {
    this.emit(DecksEvent("gesture:pan:x", this, e));
  },

  onPanY: function(e) {
    this.emit(DecksEvent("gesture:pan:y", this, e));
  },

  onPanEnd: function(e) {
    this.emit(DecksEvent("gesture:pan:end", this, e));
  },

  onPanCancel: function(e) {
    this.emit(DecksEvent("gesture:pan:cancel", this, e));
  }
});

module.exports = PanEmitter;
