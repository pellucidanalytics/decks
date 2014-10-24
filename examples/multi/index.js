var _ = require("lodash");
var $ = require("jquery");
var Velocity = require('velocity-animate');
var decks = require('../..');
var Deck = decks.Deck;
var BasicGridLayout = decks.layouts.BasicGridLayout;
var BasicStackLayout = decks.layouts.BasicStackLayout;
var ZoomLayout = decks.layouts.ZoomLayout;

var id = 0;
var imageWidth = 800;
var imageHeight = 600;

function createItem() {
  id++;
  return {
    id: id,
    width: 300,
    height: 200,
    random: Math.random(),
    groups: getRandomGroups(),
    imgUrl: "http://lorempixel.com/" + imageWidth + "/" + imageHeight + "/",
    label: "Image"
  };
}

function createItems(count) {
  count = count || 20;
  var items = _.map(_.range(count), createItem);
  return items;
}

function getRandomGroups(count) {
  count = count || 5;
  return _.reduce(_.range(count), function(acc, i) {
    if (Math.random() >= 0.5) {
      acc.push("group-" + i);
    }
    return acc;
  }, []);
}

function loadRender(render) {
  var item = render.item;

  //console.log("loadRender item %s, render %s", render.item.id, render.id, render.image);

  if (!render.image) {
    render.image = new Image(imageWidth, imageHeight);
    render.image.src = item.get("imgUrl");
    render.image.ondragstart = function() { return false; };
    render.element.appendChild(render.image);
  }
}

function unloadRender(/*render*/) {
  //render.element.innerHTML = "";
}

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
  }),
  zoom: new ZoomLayout({
    padding: 10,
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
    deck.addItem(createItem());
  });

  // Remove item button
  $(".remove-item-button").on("click", function() {
    var items = deck.getItems();
    if (_.isEmpty(items)) {
      return;
    }
    var index = Math.floor(Math.random() * (items.length - 1));
    var item = items[index];
    deck.removeItem(item);
  });

  // Clear items button
  $(".clear-items-button").on("click", function() {
    deck.clear();
  });

  // add items button
  $(".add-items-button").on("click", function() {
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

  var sortBy = function(item) {
    return item.get("random");
  };

  $(".toggle-sort-by-button").on("click", function() {
    deck.setSortBy(deck.itemCollection.sortBy ? null : sortBy);
  });

  $(".toggle-reverse-button").on("click", function() {
    deck.setReversed(!deck.itemCollection.isReversed);
  });

  // set the initial layout (from the select box)
  var layout = layouts[$layoutSelect.val()];

  // Get the frame element (from the page)
  var frameElement = $root[0];

  // Create the Deck
  var deck = new Deck({
    config: {
      debugEvents: false,
      debugDrawing: false,
      debugGestures: false
    },
    animator: {
      animate: Velocity
    },
    items: createItems(),
    frame: {
      element: frameElement
    },
    layout: layout
  });
});
