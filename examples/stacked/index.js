var Velocity = require('velocity-animate');
var Decks = require('../..');
var foods = require('./data').foods;

////////////////////////////////////////////////////////////////////////////////
// Functions to be passed in when we create our deck
////////////////////////////////////////////////////////////////////////////////

var getRenders = function (options) {
  // theoretically, maintain a separate list of where stacks of tags
  // should be positioned, given an viewport dimensions

  var row = Math.floor(options.index / 4);
  var column = options.index % 4;

  return {
    "stack1": {
      transform: {
        top: row * 220,
        left: column * 320,
        width: 300,
        height: 200
      },
      animateOptions: {
        duration: 400 + options.index * 20,
        easing: "ease-in"
      }
    }
  };
};

var loadRender = function (options) {
  var imgUrl = options.item.get('imgUrl');
  options.newRender.element.innerHTML = "<div><img src='" + imgUrl + "' /></div>";
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

myDeck.addItems(foods, {silent: true});
myDeck.layout.draw();
