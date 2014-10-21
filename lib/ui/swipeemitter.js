var _ = require("lodash");
var Hammer = require("../../vendor").Hammer;
var GestureEmitter = require("./gestureemitter");
var DecksEvent = require("../events/decksevent");

function SwipeEmitter(element, options) {
  if (!(this instanceof SwipeEmitter)) { return new SwipeEmitter(element, options); }

  options = _.merge({}, this.defaultOptions, options);

  GestureEmitter.call(this, element, options);

  this.horizontal = options.horizontal;
  this.vertical = options.vertical;
  this.threshold = options.threshold;
  this.velocity = options.velocity;

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

SwipeEmitter.prototype = _.create(GestureEmitter.prototype, /** @lends SwipeEmitter.prototype */ {
  constructor: SwipeEmitter,

  defaultOptions: _.merge({}, GestureEmitter.prototype.defaultOptions, {
    horizontal: false,
    vertical: true,
    threshold: 0,
    velocity: 0.64
  }),

  getHammerEvents: function() {
    var map = { };
    if (this.horizontal && this.vertical) {
      _.extend(map, {
        "swipe": "onSwipe"
      });
    } else if (this.horizontal) {
      _.extend(map, {
        "swipeleft swiperight": "onSwipeX"
      });
    } else if (this.vertical) {
      _.extend(map, {
        "swipeup swipedown": "onSwipeY"
      });
    }
    return map;
  },

  onSwipe: function(e) {
    this.emit(DecksEvent("gesture:swipe:any", this, e));
  },

  onSwipeX: function(e) {
    this.emit(DecksEvent("gesture:swipe:x", this, e));
  },

  onSwipeY: function(e) {
    this.emit(DecksEvent("gesture:swipe:y", this, e));
  }
});

module.exports = SwipeEmitter;
