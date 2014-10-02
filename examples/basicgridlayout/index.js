var _ = require("lodash");
var Velocity = require('velocity-animate');
var decks = require('../..');
var BasicGridLayout = decks.layouts.BasicGridLayout;
var BasicStackLayout = decks.layouts.BasicStackLayout;

var items = _.map(_.range(100), function(i) {
  return {
    index: i,
    imgUrl: "http://lorempixel.com/"
  };
});

var layouts = {
  grid: new BasicGridLayout({
    itemWidth: 100,
    itemHeight: 80,
    itemPadding: 10,
    itemsPerRow: 10
  }),
  stack: new BasicStackLayout({
    itemWidth: 100,
    itemHeight: 80,
    itemPadding: 40,
    itemsPerRow: 10
  })
};

var loadRender = function (options) {
  var imgUrl = options.item.get('imgUrl') + "/" + options.layout.itemWidth + "/" + options.layout.itemHeight + "/"; //"/?" + Math.random();
  options.newRender.element.innerHTML = "<div><img src='" + imgUrl + "' /></div>";
  options.item.isLoaded = true;
};

var unloadRender = function (options) {
  options.newRender.element.innerHTML = "";
  options.item.isLoaded = false;
};


$(function() {
  var $layoutSelect = $(".select-layout");

  var layout = layouts[$layoutSelect.val()];

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

  $layoutSelect.on("change", function(e) {
    var val = $layoutSelect.val();
    console.log(val);

    var layout = layouts[val];
    myDeck.setLayout(layout);
  });
});

