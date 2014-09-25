(function() {
  var Scroller = function(options) {
    // Container
    this.$container = $(options.container) || $("<div>");

    // Items
    this.items = options.items; // array of decks "Item" objects - so Scroller can control load/unload
    this.itemWidth = options.itemWidth;
    this.itemHeight = options.itemHeight;
    this.itemGutterSize = options.itemGutterSize; // (internal padding between items)
    this.itemPaddingSize = options.itemPaddingSize;

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

      self.$container.empty();

      // Scroller container with overflow hidden and width of container.
      // The items scroll within this container, and touch gestures are bound to this container
      self.$scrollerLevel1 = $("<div>")
        .addClass("scroller-level1")
        .css({
          width: self.$container.width(),
          height: self.$container.height()
        })
        .appendTo(self.$container);

      // Scroller inner container with full width of items.
      // This container scrolls within the level 1 container.
      self.$scrollerLevel2 = $("<div>")
        .addClass("scroller-level2")
        .css({
          width: self.itemWidth * items.length + self.itemGutterSize * (items.length + 1),
          height: self.itemHeight + self.itemPaddingSize * 2
        })
        .appendTo(self.$scrollerLevel1);

      self.isSwiping = false;
      self.startLeft = 0;

      _.each(self.items, function(item) {
        self.$scrollerLevel2.append(item.load());
      });

      self.bind();
    },

    /**
     * Binds events
     */
    bind: function() {
      self.$scrollerLevel1.hammer();
      this.$scrollerLevel1.on("pan", _.bind(this.onPan, this));
      this.$scrollerLevel1.on("tap press touchstart mousedown", _.bind(this.onTap, this));
      this.$scrollerLevel1.on("swipe", _.bind(this.onSwipe, this));
    },

    /**
     * Unbind events
     */
    unbind: function() {
      this.$scrollerLevel1.off("pan tap press touchstart mousedown swipe");
    },

    onPan: function(e) {
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

    onTap: function(e) {
      console.log(e.type);
      self.$scrollerLevel2.velocity("stop");
    },

    onSwipe: function(e) {
      console.log(e.type, e.gesture.deltaX, e.gesture.velocityX, e.gesture);

      // velocityX is positive for moving left, negative for moving right
      var distanceX = e.gesture.velocityX * self.swipeDistanceMultiplier;
      var deltaLeft = "-=" + (distanceX) + "px";
      var duration = Math.abs(e.gesture.velocityX * self.swipeDurationMultiplier);
      var easing = self.swipeEasing;

      self.isSwiping = true;
      $level2.velocity({
          "left": deltaLeft
        }, {
          duration: duration,
          easing: easing,
          complete: function() {
            self.startLeft = parseInt($level2.css("left"));
            self.isSwiping = false;
          }
        });
    }
  });

  $(function() {
    var $body = $("body");
    var $level1 = $("#level1");
    var $level2 = $("#level2");

    var itemCount = 10;
    var width = 300;
    var height = 200;
    var margin = 10;

    var startLeft = 10;
    var startTop = 10;

    var isSwiping = false;

    $level1.width($(window).width() - margin * 2);
    $level1.height(height + margin * 2);

    $level2.height(height + margin * 2);
    $level2.width(width * itemCount + margin * (itemCount + 1));

    // Add the images to #root
    _.each(_.range(itemCount), function(i) {
      var image = new Image(width, height);
      image.src = "http://lorempixel.com/" + width + "/" + height + "/";

      image.style.top = "10px";
      image.style.left = ((width * i) + (margin * (i + 1))) + "px";

      $level2.append(image);
    });

    // Setup touch events on the level1 container
    $level1.hammer();

    $level1.on("pan", function(e) {
      console.log(e.type, e.gesture.deltaX, e.gesture.velocityX, e.gesture);

      if (isSwiping) {
        return;
      }

      var newLeft = startLeft + e.gesture.deltaX;
      $level2.css("left", newLeft);
      if (e.gesture.isFinal) {
        startLeft = newLeft;
      }
    });

    $level1.on("tap press touchstart mousedown", function(e) {
      console.log(e.type);
      $level2.velocity("stop");
    });

    $level1.on("swipe", function(e) {
      console.log(e.type, e.gesture.deltaX, e.gesture.velocityX, e.gesture);

      // velocityX is positive for moving left, negative for moving right
      var distanceMultiplier = 200;
      var durationMultiplier = 100;
      var distanceX = e.gesture.velocityX * distanceMultiplier;
      var deltaLeft = "-=" + (distanceX) + "px";
      var duration = Math.abs(e.gesture.velocityX * durationMultiplier);
      //var easing = "easeOutCubic";
      //var easing = "easeOutElastic";
      var easing = [200, 20];

      isSwiping = true;
      $level2.velocity({
          "left": deltaLeft
        }, {
          duration: duration,
          easing: easing,
          complete: function() {
            startLeft = parseInt($level2.css("left"));
            isSwiping = false;
          }
        });
    });

  });
}());
