var _ = require("lodash");
var inherits = require("inherits");
var Hammer = require("../../vendor").Hammer;
var services = require("../services");
var GestureEmitter = require("./gestureemitter");
var DecksEvent = require("../events/decksevent");

function PanEmitter(element, options) {
  if (!(this instanceof PanEmitter)) { return new PanEmitter(element, options); }
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

inherits(PanEmitter, GestureEmitter);

_.extend(PanEmitter.prototype, {

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
    services.emitter.emit(DecksEvent("gesture:pan:start", this, e));
  },

  onPanMove: function(e) {
    services.emitter.emit(DecksEvent("gesture:pan:any", this, e));
  },

  onPanX: function(e) {
    services.emitter.emit(DecksEvent("gesture:pan:x", this, e));
  },

  onPanY: function(e) {
    services.emitter.emit(DecksEvent("gesture:pan:y", this, e));
  },

  onPanEnd: function(e) {
    services.emitter.emit(DecksEvent("gesture:pan:end", this, e));
  },

  onPanCancel: function(e) {
    services.emitter.emit(DecksEvent("gesture:pan:cancel", this, e));
  }
});

module.exports = PanEmitter;
