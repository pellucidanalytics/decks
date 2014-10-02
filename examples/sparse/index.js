var Velocity = require('velocity-animate');
var Decks = require('../..');
var list = require('./data').list;

////////////////////////////////////////////////////////////////////////////////
// Functions to be passed in when we create our deck
////////////////////////////////////////////////////////////////////////////////

function rand(max) {
  return - max / 2 + Math.random() * max;
}

var getRenders = function (options) {
  // theoretically, maintain a separate list of where stacks of tags
  // should be positioned, given an viewport dimensions

  var index = options.index;
  var rows = 3;
  var cols = 3;
  var row = Math.floor(index / rows) % rows;
  var column = index % cols;

  return {
    "0": {
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
  };
};

var loadRender = function (options) {
  var url = options.item.get('url');
  options.newRender.element.style.zIndex = options.index;
  options.newRender.element.innerHTML = "<img width=300 height=200 src='" + url + "'/>";
  options.item.isLoaded = true;
};

var unloadRender = function (options) {
  options.newRender.element.innerHTML = "";
  options.item.isLoaded = false;
};

////////////////////////////////////////////////////////////////////////////////
// Initialize the deck and populate it with items
////////////////////////////////////////////////////////////////////////////////

var myDeck = new Decks.Deck({
  viewport: {
    animate: Velocity,
    frame: document.body
  },
  layout: {
    getRenders: getRenders
  },
  itemRenderer: {
    loadRender: loadRender,
    unloadRender: unloadRender
  }
});

myDeck.addItems(list, {silent: true});
myDeck.layout.draw();
