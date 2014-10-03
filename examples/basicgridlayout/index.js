var _ = require("lodash");
var $ = require("jquery");
var Velocity = require('velocity-animate');
var decks = require('../..');
var Deck = decks.Deck;
var BasicGridLayout = decks.layouts.BasicGridLayout;
var BasicStackLayout = decks.layouts.BasicStackLayout;

var items = _.map(_.range(20), function(i) {
  return {
    index: i,
    imgUrl: "http://lorempixel.com",
    label: "Image " + i
  };
});

var loadRender = function (options) {
  var item = options.item;
  var render = options.render;

  if (render.isLoading || render.isLoaded) {
    return;
  }

  render.isLoading = true;
  render.isLoaded = false;

  var imgUrl = item.get('imgUrl') + "/" + this.itemWidth + "/" + this.itemHeight + "/"; //"/?" + Math.random();

  var img = new Image(this.itemWidth, this.itemHeight);
  img.onload = _.bind(function() {
    console.log("render loaded");

    render.isLoading = false;
    render.isLoaded = true;
  }, this);
  img.src = imgUrl;

  render.element.innerHTML = "";
  render.element.appendChild(img);
};

var unloadRender = function (options) {
  console.log("unloadRender");
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
    unloadRender: unloadRender
  }),
  grid2: new BasicGridLayout({
    itemWidth: 150,
    itemHeight: 120,
    itemPadding: 15,
    itemsPerRow: 6,
    loadRender: loadRender,
    unloadRender: unloadRender
  }),
  stack: new BasicStackLayout({
    itemWidth: 100,
    itemHeight: 80,
    itemPadding: 40,
    itemsPerRow: 9,
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
