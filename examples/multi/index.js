var _ = require("lodash");
var $ = require("jquery");
var Velocity = require('velocity-animate');
var decks = require('../..');
var Deck = decks.Deck;
var BasicGridLayout = decks.layouts.BasicGridLayout;
var BasicStackLayout = decks.layouts.BasicStackLayout;

var i = -1;

function createItem() {
  i++;
  return {
    width: 300,
    height: 200,
    imgUrl: "http://lorempixel.com",
    label: "Image " + i
  };
}

var items = _.map(_.range(20), createItem);

var loadRender = function (options) {
  var item = options.item;
  var render = options.render;

  var shouldLoad = !render.isLoading &&
    (render.transform.width != render.lastWidth) &&
    (render.transform.height != render.lastHeight);

  if (!shouldLoad) {
    return;
  }

  render.isLoading = true;

  var imgUrl = item.get('imgUrl') + "/" + item.get("width") + "/" + item.get("height") + "/"; //"/?" + Math.random();

  var img = new Image(this.itemWidth, this.itemHeight);

  img.onload = _.bind(function() {
    //console.log("render loaded");
    render.isLoading = false;
    render.lastWidth = render.transform.width;
    render.lastHeight = render.transform.height;
    render.element.innerHTML = "";
    render.element.appendChild(img);
  }, this);

  img.src = imgUrl;
};

var unloadRender = function (options) {
  //console.log("unloadRender");
  options.newRender.element.innerHTML = "";
  options.item.isLoaded = false;
};

var layouts = {
  grid1: new BasicGridLayout({
    itemWidth: 100,
    itemHeight: 80,
    itemPadding: 10,
    itemsPerRow: 9,
    loadRender: loadRender,
    unloadRender: unloadRender,
    transform: {
      rotateZ: 1080
    },
    animateOptions: {
    }
  }),
  grid2: new BasicGridLayout({
    itemWidth: 150,
    itemHeight: 120,
    itemPadding: 15,
    itemsPerRow: 6,
    loadRender: loadRender,
    unloadRender: unloadRender,
    transform: {
      rotateZ: 360
    },
    animateOptions: {
    }
  }),
  stack: new BasicStackLayout({
    itemWidth: 200,
    itemHeight: 160,
    itemPadding: 40,
    itemsPerRow: 4,
    loadRender: loadRender,
    unloadRender: unloadRender
  })
};

$(function() {
  var $root = $("#root");

  var $layoutSelect = $(".layout-select");

  _.each(layouts, function(layout, key) {
    var $option = $("<option>").text(key);
    $layoutSelect.append($option);
  });

  $layoutSelect.on("change", function(e) {
    var val = $layoutSelect.val();
    var layout = layouts[val];
    deck.setLayout(layout);
  });

  var $addItemButton = $(".add-item-button")
    .on("click", function(e) {
      console.log("add item");
      deck.addItem(createItem(items.length));
    });

  var $removeItemButton = $(".remove-item-button")
    .on("click", function(e) {
      console.log("remove item");
      var items = deck.itemCollection.getItems();
      var index = Math.floor(Math.random() * (items.length - 1));
      var item = items[index];
      deck.removeItem(item);
    });

  var $clearItemsButton = $(".clear-items-button")
    .on("click", function(e) {
      console.log("clear");
      deck.clear();
    });

  var $addItemsButton = $(".add-items-button")
    .on("click", function(e) {
      console.log("add items");
      deck.addItems(items);
    });

  var layout = layouts[$layoutSelect.val()];

  var frameElement = $root[0];

  var deck = new Deck({
    items: items,
    viewport: {
      animator: {
        animate: Velocity
      },
      frame: {
        element: frameElement
      },
      canvas: {
        width: "1024px",
        height: "3000px"
      }
    },
    layout: layout
  });

  //deck.viewport.drawItems();
});
