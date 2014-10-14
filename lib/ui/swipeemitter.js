var _ = require("lodash");
var inherits = require("inherits");
var services = require("../services");
var Hammer = require("../../vendor").Hammer;
var GestureEmitter = require("./gestureemitter");
var DecksEvent = require("../events/decksevent");

function SwipeEmitter(element, options) {
  if (!(this instanceof SwipeEmitter)) { return new SwipeEmitter(element, options); }
  GestureEmitter.call(this, element, options);

  this.horizontal = !!options.horizontal;
  this.vertical = !!options.vertical;
  this.threshold = options.threshold || 0;
  this.velocity = options.velocity || 0.65;
  if (this.horizontal && this.vertical) {
    this.direction = Hammer.DIRECTION_ALL;
  } else if (this.horizontal) {
    this.direction = Hammer.DIRECTION_HORIZONTAL;
  } else {
    this.direction = Hammer.DIRECTION_VERTICAL;
  }

  this.hammer.get("swipe").set({
    direction: this.direction,
    threshold: this.threshold,
    velocity: this.velocity
  });

  this.bindHammerEvents();
}

inherits(SwipeEmitter, GestureEmitter);

_.extend(SwipeEmitter.prototype, {
  getHammerEvents: function() {
    var map = { };
    if (this.horizontal && this.vertical) {
      _.extend(map, {
        "swipe": "onSwipe"
      });
    } else if (this.horizontal) {
      _.extend(map, {
        "swipeleft swiperight": "onSwipeHorizontal"
      });
    } else if (this.vertical) {
      _.extend(map, {
        "swipeup swipedown": "onSwipeVertical"
      });
    }
    return map;
  },

  onSwipe: function(e) {
    services.emitter.emit(DecksEvent("gesture:swipe:any", this, e));
  },

  onSwipeX: function(e) {
    services.emitter.emit(DecksEvent("gesture:swipe:x", this, e));
  },

  onSwipeY: function(e) {
    services.emitter.emit(DecksEvent("gesture:swipe:y", this, e));
  }
});

module.exports = SwipeEmitter;
