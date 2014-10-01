var _ = require("lodash");
var Velocity = require('velocity-animate');
var decks = require('../..');
var BasicGridLayout = decks.layouts.BasicGridLayout;

var items = _.map(_.range(100), function(i) {
  return {
    index: i,
    imgUrl: "http://lorempixel.com/"
  };
});

var layout = new BasicGridLayout();

var loadRender = function (options) {
  var imgUrl = options.item.get('imgUrl') + "/" + options.layout.itemWidth + "/" + options.layout.itemHeight + "/";
  options.newRender.element.innerHTML = "<div><img src='" + imgUrl + "' /></div>";
  options.item.isLoaded = true;
};

var unloadRender = function (options) {
  options.newRender.element.innerHTML = "";
  options.item.isLoaded = false;
};

var myDeck = new decks.Deck({
  viewport: {
    animate: Velocity,
    frame: document.body
  },
  layout: layout,
  itemRenderer: {
    loadRender: loadRender,
    unloadRender: unloadRender
  }
});

myDeck.addItems(items, {silent: true});
myDeck.layout.draw();
