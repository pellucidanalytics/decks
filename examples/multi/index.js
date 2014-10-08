var _ = require("lodash");
var $ = require("jquery");
var Velocity = require('velocity-animate');
var decks = require('../..');
var Deck = decks.Deck;
var BasicGridLayout = decks.layouts.BasicGridLayout;
var BasicStackLayout = decks.layouts.BasicStackLayout;

function createItem() {
  return {
    width: 300,
    height: 200,
    random: Math.random(),
    imgUrl: "http://lorempixel.com",
    label: "Image"
  };
}

function createItems(count) {
  count = count || 20;
  return _.map(_.range(count), createItem);
}

var loadRender = function (render) {
  var item = render.item;

  var shouldLoad = !render.isLoading &&
    (render.transform.width !== render.lastWidth) &&
    (render.transform.height !== render.lastHeight);

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

var unloadRender = function(render) {
  var item = render.item;

  //console.log("unloadRender");
  render.element.innerHTML = "";
  item.isLoaded = false;
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

  // Layout select box
  var $layoutSelect = $(".layout-select");

  _.each(layouts, function(layout, key) {
    var $option = $("<option>").text(key);
    $layoutSelect.append($option);
  });

  $layoutSelect.on("change", function() {
    var val = $layoutSelect.val();
    var layout = layouts[val];
    deck.setLayout(layout);
  });

  // Add item button
  $(".add-item-button").on("click", function() {
    console.log("add item");
    deck.addItem(createItem());
  });

  // Remove item button
  $(".remove-item-button").on("click", function() {
    console.log("remove item");
    var items = deck.itemCollection.getItems();
    if (_.isEmpty(items)) {
      return;
    }
    var index = Math.floor(Math.random() * (items.length - 1));
    var item = items[index];
    deck.removeItem(item);
  });

  // Clear items button
  $(".clear-items-button").on("click", function() {
    console.log("clear");
    deck.clear();
  });

  // add items button
  $(".add-items-button").on("click", function() {
    console.log("add items");
    deck.addItems(createItems());
  });

  $(".filter-evens-button").on("click", function() {
    deck.setFilter(function(item) {
      return parseInt(item.id) % 2 === 0;
    });
  });

  $(".filter-odds-button").on("click", function() {
    deck.setFilter(function(item) {
      return parseInt(item.id) % 2 !== 0;
    });
  });

  $(".filter-clear-button").on("click", function() {
    deck.setFilter(null);
  });

  var currentSortBy = null;
  var sortBy = function(item) {
    return item.get("random");
  };
  $(".toggle-sort-by-button").on("click", function() {
    currentSortBy = currentSortBy ? null : sortBy;
    deck.setSortBy(currentSortBy);
  });

  var isReversed = false;
  $(".toggle-reverse-button").on("click", function() {
    isReversed = !isReversed;
    deck.setReversed(isReversed);
  });

  // set the initial layout (from the select box)
  var layout = layouts[$layoutSelect.val()];

  // Get the frame element (from the page)
  var frameElement = $root[0];

  // Create the Deck
  var deck = new Deck({
    items: createItems(),
    animator: {
      animate: Velocity
    },
    viewport: {
      frame: {
        element: frameElement
      }
    },
    layout: layout
  });

  //deck.viewport.drawItems();
});
