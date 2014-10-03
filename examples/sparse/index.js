var Velocity = require('velocity-animate');
var Decks = require('../..');
var list = require('./data').list;

function rand(max) {
  return - max / 2 + Math.random() * max;
}

var getRenders = function (options) {
  var index = options.index;
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

var loadRender = function (options) {
  var url = options.item.get('url');
  options.render.element.style.zIndex = options.index;
  options.render.element.innerHTML = "<img width=300 height=200 src='" + url + "'/>";
  options.item.isLoaded = true;
};

var unloadRender = function (options) {
  options.render.element.innerHTML = "";
  options.item.isLoaded = false;
};

var myDeck = new Decks.Deck({
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
