/*
var Scroller = function(options) {
  this.container = options.container;
  this.items = options.items; // array of decks "Item" objects - so Scroller can control load/unload
  this.itemWidth = options.itemWidth;
  this.itemHeight = options.itemHeight;
  this.itemGutterSize = options.itemGutterSize; // (internal padding between items)
  this.containerPadding = options.containerPadding; // (padding around the items)
  this.direction = options.direction || "h"; // h or v

  // Animations/physics
  //this.elasticDistance = options.elasticDistance || 40;
  //this.elastic = _.isUndefined(options.elastic) ? ...; // enable or disable

  // Create ".scroller-level1" inside container (width: container width)
  // Create ".scroller-level2" inside .scroller-level1 (position: relative, width: all items + gutters)
  // Create ".scroller-item" elements inside .scroller-level2 (position: absolute, top+left set by item width + gutter)
  // appen items into .scroller-items


  // Events
  // item-in-view
};
*/

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

  $level1.on("swipe", function(e) {
    console.log(e.type, e.gesture.deltaX, e.gesture.velocityX, e.gesture);

    // velocityX is positive for moving left, negative for moving right
    var deltaLeft = "-=" + Math.pow(e.gesture.velocityX, 3) + "px";

    isSwiping = true;
    $level2.velocity({
        "left": deltaLeft
      }, {
        duration: 1000,
        easing: "easeOutElastic",
        complete: function() {
          startLeft = parseInt($level2.css("left"));
          isSwiping = false;
        }
      });
  });

});
