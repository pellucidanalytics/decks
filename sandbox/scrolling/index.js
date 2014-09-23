$(function() {
  var $body = $("body");
  var $level1 = $("#level1");
  var $level2 = $("#level2");

  var itemCount = 10;
  var width = 300;
  var height = 200;
  var margin = 10;

  var startX = 10;
  var startY = 10;

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
  $level1.on("pan swipe", function(e) {
    var gesture = _.pick(e.gesture, ["isFirst", "isFinal", "deltaX", "deltaY", "direction", "velocityX", "velocityY"]);

    console.log(e.type, gesture);

    // Move the left of #level2 container within the #level1 container
    // #level1 has overlfow hidden, so #level2 can scroll within in
    var newX = startX + gesture.deltaX;
    $level2.css("left", startX + gesture.deltaX);
    if (gesture.isFinal) {
      startX = newX;
    }
  });

});
