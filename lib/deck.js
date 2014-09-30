var _ = require("lodash");
var EventEmitter = require("events").EventEmitter;
var util = require("util");
var ItemCollection = require("./itemcollection");
var ItemRenderer = require("./itemrenderer");

function Deck(options) {
  if (!(this instanceof Deck)) { return new Deck(options); }
  if (!options.itemRenderer) { throw new Error("options.itemRenderer is required (ItemRenderer options or instance)"); }
  if (!options.viewport) { throw new Error("options.viewport is required (Viewport options or instance)"); }
  if (!options.layout) { throw new Error("options.layout is required (Layout options or instance)"); }

  EventEmitter.call(this);

  this.setItemCollection(options.itemCollection || options.items || []);
  this.setItemRenderer(options.itemRenderer);
  this.setViewport(options.viewport); // use default
  this.setLayout(options.layout); // use standard grid layout
}

util.inherits(Deck, EventEmitter);

_.extend(Deck.prototype, {

  addItem: function(item) {
    this.itemCollection.addItem(item);
  },

  addItems: function(items) {
    this.itemCollection.addItems(items);
  },

  removeItem: function(item) {
    this.itemCollection.removeItem(item);
  },

  clear: function() {
    this.itemCollection.clear();
  },

  setItemCollection: function(itemCollection) {
    if (!(itemCollection instanceof ItemCollection)) {
      itemCollection = new ItemCollection(itemCollection);
    }
    this.itemCollection = itemCollection;
    this.layout.setItemCollection(this.itemCollection);
  },

  setItemRenderer: function(itemRenderer) {
    if (!(itemRenderer instanceof ItemRenderer)) {
      itemRenderer = new ItemRenderer(itemRenderer);
    }
    this.itemRenderer = itemRenderer;
    this.viewport.setItemRenderer(this.itemRenderer);
  },

  setViewport: function(viewport) {
    if (!(viewport instanceof Viewport)) {
      viewport = new Viewport(viewport);
    }

    if (this.viewport) {
      // TODO: unbind viewport events?
    }

    this.viewport = viewport;
    this.viewport.setItemRenderer(this.itemRenderer);
    this.layout.setViewport(this.viewport);
  },

  setLayout: function(layout) {
    if (!(layout instanceof Layout)) {
      layout = new Layout(layout);
    }

    if (this.layout) {
      this.layout.unbindCollectionEvents();
      this.layout.unbindViewportEvents();
    }

    this.layout = layout;
    this.layout.setItemCollection(this.itemCollection);
    this.layout.setViewport(this.viewport);
  }
});

module.exports = Deck;

