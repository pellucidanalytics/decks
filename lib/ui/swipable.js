var _ = require("lodash");
var inherits = require("inherits");
var Hammer = require("../../vendor").Hammer;
var Gesturable = require("./gesturable");

function Swipable(element, options) {
  if (!(this instanceof Swipable)) { return new Swipable(element, options); }
  Gesturable.call(this, element, options);

  if (!this.enabled) {
    return;
  }

  var direction;
  if (this.horizontal && this.vertical) {
    direction = Hammer.DIRECTION_ALL;
  } else if (this.horizontal) {
    direction = Hammer.DIRECTION_HORIZONTAL;
  } else {
    direction = Hammer.DIRECTION_VERTICAL;
  }
  this.hammer.get("swipe").set({ direction: direction });
}

inherits(Swipable, Gesturable);

_.extend(Swipable.prototype, {
  getHammerEvents: function() {
    var map = { };
    if (this.horizontal) {
      _.extend(map, {
        "swipeleft swiperight": "onSwipeHorizontal"
      });
    }
    if (this.vertical) {
      _.extend(map, {
        "swipeup swipedown": "onSwipeHorizontal"
      });
    }
    return map;
  },

  onSwipeHorizontal: function(e) {
    console.log("swipe h", e);
  },

  onSwipeVertical: function(e) {
    console.log("swipe v", e);
  }
});

module.exports = Swipable;
