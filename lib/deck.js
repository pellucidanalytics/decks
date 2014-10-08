var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");
var Layout = require("./layout");
var Viewport = require("./viewport");
var ItemCollection = require("./itemcollection");
var eventBinder = require("./util").eventBinder;

/**
 * Top-level API for managing the "decks.js" system.
 * Contains all of the coordinating objects for managing items, collections of items,
 * viewports, layouts, etc.
 *
 * @constructor
 * @augments EventEmitter2
 * @mixes eventBinder
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

_.extend(Deck.prototype, eventBinder, /** @lends Deck.prototype */ {

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

  setFilter: function(filter) {
    this.itemCollection.setFilter(filter);
  },

  setSortBy: function(sortBy) {
    this.itemCollection.setSortBy(sortBy);
  },

  setReversed: function(isReversed) {
    this.itemCollection.setReversed(isReversed);
  },

  setItemCollection: function(itemCollection, options) {
    itemCollection = itemCollection || [];
    options = options || {};

    if (this.itemCollection === itemCollection) { return; }

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

    if (!options.silent) {
      this.emit("deck:item:collection:set", itemCollection);
    }
  },

  setViewport: function(viewport, options) {
    if (!viewport) { throw new Error("viewport is required"); }
    options = options || {};

    if (this.viewport === viewport) { return; }

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

    if (!options.silent) {
      this.emit("deck:viewport:set", this.viewport);
    }
  },

  setLayout: function(layout, options) {
    if (!layout) { throw new Error("layout is required"); }
    options = options || {};

    if (this.layout === layout) { return; }

    if (!(layout instanceof Layout)) {
      layout = new Layout(layout);
    }

    this.layout = layout;

    if (this.itemCollection) {
      this.layout.setItemCollection(this.itemCollection);
    }

    if (this.viewport) {
      this.layout.setViewport(this.viewport);
      this.viewport.setLayout(this.layout);
    }

    if (!options.silent) {
      this.emit("deck:layout:set", this.layout);
    }
  }
});

module.exports = Deck;

