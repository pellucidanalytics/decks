var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");
var Layout = require("./layout");
var Viewport = require("./viewport");
var ItemCollection = require("./itemcollection");

/**
 * Top-level API for managing the "decks.js" system.
 * Contains all of the coordinating objects for managing items, collections of items,
 * viewports, layouts, etc.
 *
 * @constructor
 * @augments EventEmitter
 * @param {Object} options deck options
 */
function Deck(options) {
  if (!(this instanceof Deck)) { return new Deck(options); }
  EventEmitter.call(this);

  this.setItemCollection(options.itemCollection || options.items || []);
  this.setLayout(options.layout);
  this.setViewport(options.viewport);
}

inherits(Deck, EventEmitter);

_.extend(Deck.prototype, {

  /**
   * Adds an item to the internal ItemCollection
   *
   * @param {Item|Object} item item to add
   * @param {?Object} options additional options
   * @return {undefined}
   */
  addItem: function(item, options) {
    this.itemCollection.addItem(item, options);
  },

  addItems: function(items, options) {
    this.itemCollection.addItems(items, options);
  },

  removeItem: function(item, options) {
    this.itemCollection.removeItem(item, options);
  },

  clear: function(options) {
    this.itemCollection.clear(options);
  },

  setItemCollection: function(itemCollection) {
    itemCollection = itemCollection || [];

    if (!(itemCollection instanceof ItemCollection)) {
      itemCollection = new ItemCollection(itemCollection);
    }

    this.itemCollection = itemCollection;

    if (this.viewport) {
      this.viewport.setItemCollection(this.itemCollection);
    }

    if (this.layout) {
      this.layout.setItemCollection(this.itemCollection);
    }
  },

  setViewport: function(viewport) {
    if (!viewport) { throw new Error("viewport is required"); }

    if (!(viewport instanceof Viewport)) {
      viewport = new Viewport(viewport);
    }

    this.viewport = viewport;

    if (this.layout) {
      this.viewport.setLayout(this.layout);
      this.layout.setViewport(this.viewport);
    }

    if (this.itemCollection) {
      this.viewport.setItemCollection(this.itemCollection);
    }
  },

  setLayout: function(layout) {
    if (!layout) { throw new Error("layout is required"); }

    if (!(layout instanceof Layout)) {
      layout = new Layout(layout);
    }

    this.layout = layout;

    if (this.viewport) {
      this.layout.setViewport(this.viewport);
      this.viewport.setLayout(this.layout);
    }

    if (this.itemCollection) {
      this.layout.setItemCollection(this.itemCollection);
    }
  }
});

module.exports = Deck;

