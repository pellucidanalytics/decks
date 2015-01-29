require("../polyfills");
var $ = window.jQuery = window.$ = require("jquery");
var Velocity = window.Velocity = require("velocity-animate");
require("./velocity.ui");
var _ = require("lodash");
var decks = require('../..');
var Deck = decks.Deck;
var BasicGridLayout = decks.layouts.BasicGridLayout;
var BasicStackLayout = decks.layouts.BasicStackLayout;
var ZoomLayout = decks.layouts.ZoomLayout;
var RowLayout = decks.layouts.RowLayout;
var ColumnLayout = decks.layouts.ColumnLayout;

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

function initializeRender(render) {
  this.unloadRender(render);
}

function shouldLoadRender(render, options) {
  return !render.isLoaded && !render.isLoading && options.frame.isElementVisible(render.element);
}

function shouldUnloadRender(render, options) {
  return render.isLoaded && !options.frame.isElementVisible(render.element);
}

function loadRender(render) {
  var item = render.item;

  render.isLoading = true;
  render.isLoaded = false;
  render.isFailed = false;

  var image = new Image(imageWidth, imageHeight);

  // Prevent dragging on the image
  image.ondragstart = function() {
    return false;
  };

  image.onload = function() {
    render.isLoading = false;
    render.isLoaded = true;
    render.isFailed = false;

    render.element.innerHTML = "";
    render.element.appendChild(image);
  };

  image.onerror = image.onabort = function() {
    render.isLoading = false;
    render.isLoaded = false;
    render.isFailed = true;

    render.element.innerHTML = "<span>Error!</span>";
  };

  image.src = item.get("imgUrl");
}

function unloadRender(render) {
  render.isLoaded = false;
  render.isLoading = false;
  render.isFailed = false;

  render.element.innerHTML = "<span>Loading...</span>";
}

var layouts = {
  grid1: new BasicGridLayout({
    itemWidth: 100,
    itemHeight: 80,
    itemPadding: 10,
    itemsPerRow: 9,
    transform: {
      rotateZ: 1080
    }
  }),
  grid2: new BasicGridLayout({
    itemWidth: 150,
    itemHeight: 120,
    itemPadding: 15,
    itemsPerRow: 6,
    transform: {
      rotateZ: 360
    }
  }),
  stack: new BasicStackLayout({
    itemWidth: 200,
    itemHeight: 160,
    itemPadding: 40,
    itemsPerRow: 4
  }),
  zoom: new ZoomLayout({
    padding: 10
  }),
  row: new RowLayout({
    itemWidth: 150,
    itemHeight: 120,
    itemPadding: 40,
    itemsPerRow: 15
  }),
  column: new ColumnLayout({
    itemWidth: 150,
    itemHeight: 120,
    itemPadding: 40,
    itemsPerColumn: 15
  })
};

// Set common layout methods on all layouts
_.each(layouts, function(layout) {
  layout.initializeRender = initializeRender;
  layout.shouldLoadRender = shouldLoadRender;
  layout.shouldUnloadRender = shouldUnloadRender;
  layout.loadRender = loadRender;
  layout.unloadRender = unloadRender;
});

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

  $(".cycle-layouts-button").on("click", function() {
    var layoutKeys = _.keys(layouts);
    var currentLayoutKey = $layoutSelect.val();
    var index = _.indexOf(layoutKeys, currentLayoutKey);
    index = (index + 1) % layoutKeys.length;
    var newLayoutKey = layoutKeys[index];
    $layoutSelect.val(newLayoutKey);
    $layoutSelect.change();
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

  var evensFilter = function(item) {
    return _.parseInt(item.id) % 2 === 0;
  };

  var oddsFilter = function(item) {
    return _.parseInt(item.id) % 2 !== 0;
  };

  $(".filter-evens-button").on("click", function() {
    deck.setFilter(evensFilter);
  });

  $(".filter-odds-button").on("click", function() {
    deck.setFilter(oddsFilter);
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

  var deckOptions = {
    config: {
      debugEvents: false,
      debugDrawing: false,
      debugGestures: false,
      debugLoading: false
    },
    animator: {
      animate: Velocity
    },
    items: createItems(),
    frame: {
      element: frameElement
    },
    layout: layout,
    viewport: {
      useAnimationStopping: true
    }
  };

  // Create the Deck
  var deck = new Deck(deckOptions);

  /*
  deck.on("gesture:mouse:over", function(e) {
    console.log("mouseover", e.data.target);
  });

  deck.on("gesture:mouse:out", function(e) {
    console.log("mouseout", e.data.target);
  });
  */

  // Test the deck.panToItem method by tapping on an element
  deck.on("gesture:tap", function(e) {
    var $target = $(e.data.target).closest(".decks-item");
    if (!$target.length) {
      return;
    }

    var itemId = $target.data("item-id");

    $target.addClass("panning-to");
    _.delay(function() {
      $target.removeClass("panning-to");
    }, 2000);

    deck.panToItem(itemId);
  });

  // Test the setLayoutAndPanToItem method by pressing an element
  deck.on("gesture:press", function(e) {
    var $target = $(e.data.target).closest(".decks-item");
    if (!$target.length) {
      return;
    }

    var itemId = $target.data("item-id");

    $target.addClass("panning-to");
    _.delay(function() {
      $target.removeClass("panning-to");
    }, 2000);

    if (deck.layout === layouts.zoom) {
      deck.setLayoutAndPanToItem(layouts.grid1, itemId);
      $layoutSelect.val("grid1");
    } else {
      deck.setLayoutAndPanToItem(layouts.zoom, itemId);
      $layoutSelect.val("zoom");
    }
  });

  deck.on("gesture:moved:to:element", function(e) {
    var element = e.data;
    var $element = $(element);

    $element.addClass("panning-to");
    _.delay(function() {
      $element.removeClass("panning-to");
    }, 2000);
  });
});
