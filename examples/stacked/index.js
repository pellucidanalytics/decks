var Velocity = require('velocity-animate');
var Decks = require('../..');
var foods = require('./data').foods;

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
    "stack1": {
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
  if (options.newRender.isLoaded) {
    return;
  }
  var imgUrl = options.item.get('imgUrl');
  options.newRender.element.style.zIndex = options.index;
  options.newRender.element.innerHTML = "<div><img width=200 height=140 src='" + imgUrl + "200/140/' style=\"padding:8px 8px 24px 8px;background-color:#fff\"/></div>";
  options.newRender.isLoaded = true;
};

var unloadRender = function (options) {
  if (!options.newRender.isLoaded) {
    return;
  }
  options.newRender.element.innerHTML = "";
  options.newRender.isLoaded = false;
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

myDeck.addItems(foods, {silent: true});
myDeck.layout.draw();
