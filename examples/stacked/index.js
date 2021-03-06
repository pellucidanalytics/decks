require("../polyfills");
window.jQuery = window.$ = require("jquery"); // window global needed by Velocity for IE8
var Velocity = require("velocity-animate");
var Decks = require('../..');
var foods = require('./data').foods;

function rand(max) {
  return - max / 2 + Math.random() * max;
}

var getRenders = function(item) {
  var index = item.index;
  var rows = 3;
  var cols = 3;
  var row = Math.floor(index / rows) % rows;
  var column = index % cols;

  return {
    transform: {
      top: 250 + row * 200 + rand(20),
      left: 250 + column * 260 - rand(20),
      rotateZ: 360 - rand(30),
      scale: 1 + rand(0.5),
      opacity: [1, 0.25]
    },
    animateOptions: {
      duration: 2000, //400 + index * 20,
      easing: [250,15]// "ease"
    }
  };
};

var loadRender = function(render) {
  if (render.isLoaded) {
    return;
  }
  var imgUrl = render.item.get('imgUrl');
  render.element.innerHTML = "<div><img width=200 height=140 src='" + imgUrl + "200/140/' style=\"padding:8px 8px 24px 8px;background-color:#fff\"/></div>";
  render.isLoaded = true;
};

var unloadRender = function(render) {
  if (!render.isLoaded) {
    return;
  }
  render.element.innerHTML = "";
  render.isLoaded = false;
};

new Decks.Deck({
  animator: {
    animate: Velocity
  },
  items: foods,
  layout: {
    getRenders: getRenders,
    loadRender: loadRender,
    unloadRender: unloadRender
  },
  frame: {
    element: document.body
  }
});
