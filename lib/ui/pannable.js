var _ = require("lodash");
var inherits = require("inherits");
var Hammer = require("../../vendor").Hammer;
var Gesturable = require("./gesturable");

function Pannable(element, options) {
  if (!(this instanceof Pannable)) { return new Pannable(element, options); }

  Gesturable.call(this, element, options);

  var direction;
  if (this.horizontal && this.vertical) {
    direction = Hammer.DIRECTION_ALL;
  } else if (this.horizontal) {
    direction = Hammer.DIRECTION_HORIZONTAL;
  } else {
    direction = Hammer.DIRECTION_VERTICAL;
  }

  this.hammer.get("pan").set({ direction: direction });
}

inherits(Pannable, Gesturable);

_.extend(Pannable.prototype, {

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
    console.log("panstart", e);
    this.setStart(e);
  },

  onPanMove: function(e) {
    console.log("panmove");
    this.move(e);
  },

  onPanX: function(e) {
    console.log("panh");
    this.moveX(e);
  },

  onPanY: function(e) {
    console.log("panv");
    this.moveY(e);
  },

  onPanEnd: function(e) {
    console.log("panend", e);
    this.snapToBounds();
  },

  onPanCancel: function(e) {
    console.log("pancancel", e);
  }
});

module.exports = Pannable;
