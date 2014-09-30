var _ = require("lodash");
var EventEmitter = require("events").EventEmitter;
var util = require("util");
var ItemCollection = require("./itemcollection");

function Deck(options) {
  if (!(this instanceof Deck)) { return new Deck(options); }
  EventEmitter.call(this);

  this.itemCollection = options.itemCollection || new ItemCollection(options.items || []);
  this.itemRenderer = options.itemRenderer;

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

  setViewport: function(viewport) {
    if (this.viewport) {
      // TODO: unbind viewport events?
    }
    this.viewport = viewport;
    this.viewport.setItemRenderer(this.itemRenderer);

    // TODO: set viewport on current layout
  },

  setLayout: function(layout) {
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

