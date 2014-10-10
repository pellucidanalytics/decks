var Velocity = require('velocity-animate');
var Decks = require('../..');
var list = require('./data').list;
require("../../vendor/polyfills");

function rand(max) {
  return - max / 2 + Math.random() * max;
}

var getRenders = function (item) {
  var index = item.index;
  var rows = 3;
  var cols = 3;
  var row = Math.floor(index / rows) % rows;
  var column = index % cols;

  return [
    {
      transform: {
        top: 250 + row * 200 + rand(20),
        left: 250 + column * 260 - rand(20),
        rotateZ: 360 - rand(30),
        scale: 1 + rand(0.5),
        opacity: [1, 0.25]
      },
      animateOptions: {
        delay: index * 250,
        duration: 2000, //400 + index * 20,
        easing: [250,15]// "ease"
      }
    }
  ];
};

var loadRender = function (render) {
  if (render.isLoaded) {
    return;
  }
  var url = render.item.get('url');
  render.element.style.zIndex = render.item.index;
  render.element.innerHTML = "<img width=300 height=200 src='" + url + "'/>";
  render.isLoaded = true;
};

var unloadRender = function (render) {
  if (!render.isLoaded) {
    return;
  }
  render.element.innerHTML = "";
  render.isLoaded = false;
};

new Decks.Deck({
  items: list,
  viewport: {
    animator: {
      animate: Velocity
    },
    frame: {
      element: document.body
    }
  },
  layout: {
    getRenders: getRenders,
    loadRender: loadRender,
    unloadRender: unloadRender
  }
});
