var $ = require("jquery"); // let's just assume we are going to be sane about this...
var _ = require("lodash");

var Scroller = function(options) {
  if (!(this instanceof Scroller)) { return new Scroller(options); }

  // Container
  this.$container = $(options.container);

  // Items
  this.items = options.items; // array of decks "Item" objects - so Scroller can control load/unload
  this.itemWidth = options.itemWidth;
  this.itemHeight = options.itemHeight;
  this.itemGutterSize = options.itemGutterSize || 10; // (internal padding between items)
  this.itemPaddingSize = options.itemPaddingSize || 10; // (padding around items)

  // Scroller parameters
  this.scrollDirection = options.scrollDirection || "h"; // h or v
  this.swipeDistanceMultiplier = options.swipeDistanceMultiplier || 200;
  this.swipeDurationMultiplier = options.swipeDurationMultiplier || 100;
  this.swipeEasing = options.swipeEasing || "easeOutCubic";
  //this.swipeEasing = options.swipeEasing || [200, 20]; // spring tension/friction

  this.init();
};

_.extend(Scroller.prototype, {
  // Initialize the DOM elements
  init: function() {
    var self = this;

    // Scroller container level 1
    // Width should match container
    // with overflow hidden and width of container.
    // The items scroll within this container, and touch gestures are bound to this container
    self.$scrollerLevel1 = $("<div>")
      .addClass("scroller-level1")
      .css({
        width: self.$container.width(),
        height: self.getTotalItemHeight(),
        overflow: "hidden"
      })
      .appendTo(self.$container);

    // Scroller inner container with full width of items.
    // This container scrolls within the level 1 container.
    // This container has position relative, so the items can be absolutely positioned within it.
    self.$scrollerLevel2 = $("<div>")
      .addClass("scroller-level2")
      .css({
        width: self.getTotalItemWidth(),
        height: self.getTotalItemHeight(),
        position: "relative"
      })
      .appendTo(self.$scrollerLevel1);

    // Load the items, and insert them into the level 2 container with absolute positioning
    _.each(self.items, function(item, i, items) {
      var $item = $(item.load());

      $item.css({
        position: "absolute",
        "pointer-events": "none",
        top: self.itemPaddingSize + "px",
        left: ((self.itemWidth * i) + (self.itemGutterSize * (i + 1))) + "px"
      });

      $item.appendTo(self.$scrollerLevel2);
    });

    // State variables
    self.isSwiping = false;
    self.startLeft = 0;

    // Bind UI events
    self.bind();
  },

  getTotalItemHeight: function() {
    return this.itemHeight + this.itemPaddingSize * 2;
  },

  getTotalItemWidth: function() {
    return (this.itemWidth * this.items.length) + (this.itemGutterSize * (this.items.length + 1));
  },

  /**
   * Binds events
   */
  bind: function() {
    this.$scrollerLevel1.hammer();
    this.$scrollerLevel1.on("tap press touchstart mousedown", _.bind(this.onTap, this));
    this.$scrollerLevel1.on("panleft panright", _.bind(this.onPanX, this));
    //this.$scrollerLevel1.on("panup pandown", _.bind(this.onPanY, this));
    this.$scrollerLevel1.on("swipeleft swiperight", _.bind(this.onSwipeX, this));
    //this.$scrollerLevel1.on("swipeup swipedown", _.bind(this.onSwipeY, this));
  },

  /**
   * Unbind events
   */
  unbind: function() {
    // TODO
  },

  onTap: function(e) {
    var self = this;
    console.log(e.type);
    self.$scrollerLevel2.velocity("stop");
  },


  onPanX: function(e) {
    var self = this;
    console.log(e.type, e.gesture.deltaX, e.gesture.velocityX, e.gesture);
    if (self.isSwiping) {
      return;
    }
    var newLeft = self.startLeft + e.gesture.deltaX;
    self.$scrollerLevel2.css("left", newLeft);
    if (e.gesture.isFinal) {
      self.startLeft = newLeft;
    }
  },

  onSwipeX: function(e) {
    var self = this;
    console.log(e.type, e.gesture.deltaX, e.gesture.velocityX, e.gesture);

    // velocityX is positive for moving left, negative for moving right
    var distanceX = e.gesture.velocityX * self.swipeDistanceMultiplier;
    var deltaLeft = "-=" + (distanceX) + "px";
    var duration = Math.abs(e.gesture.velocityX * self.swipeDurationMultiplier);
    var easing = self.swipeEasing;

    self.isSwiping = true;
    self.$scrollerLevel2.velocity({
        "left": deltaLeft
      }, {
        duration: duration,
        easing: easing,
        complete: function() {
          self.startLeft = parseInt(self.$scrollerLevel2.css("left"));
          self.isSwiping = false;
        }
      });
  }
});

module.exports = Scroller;
