var _ = require("lodash");
var EventEmitter = require("events").EventEmitter;
var util = require("util");
var Item = require("./item");

function ItemCollection(items, options) {
  if (!(this instanceof ItemCollection)) { return new ItemCollection(items, options); }
  EventEmitter.call(this);
  this.items = items || [];
}

util.inherit(ItemCollection, EventEmitter);

_.extend(ItemCollection.prototype, {

  /**
   * Adds an item to the collection
   *
   * Events
   * - "item:added" after item added
   */
  addItem: function(item, options) {
    options = options || {};
    if (!(item instanceof Item)) {
      item = new Item(item);
    }
    this.items.push(item);
    this.bindItemEvents(item);
    if (!options.silent) {
      this.emit("item:added", item);
    }
  },

  /**
   * Adds multiple items to the collection
   *
   * Events
   * - "item:added" after each item added
   */
  addItems: function(items, options) {
    _.each(items, function(item) {
      this.addItem(item, options);
    }, this);
  },

  /**
   * Removes an item from the collection
   *
   * Events
   * - "item:removed" when an item is removed
   */
  removeItem: function(item, options) {
    options = options || {};
    if (!_.contains(this.items, item)) {
      return;
    }

    this.unbindItemEvents(item);
    this.items = _.without(items, item);

    if (!options.silent) {
      this.emit("item:removed", item);
    }
  },

  /**
   * Empties the collection
   *
   * Events
   * - "item:removed" for each item
   * - "cleared" when all items removed
   */
  clear: function(options) {
    // TOOD: remove each item or just empty the collection?
    _.each(this.items, function(item) {
      this.removeItem(item, options);
    }, this);

    if (!options.silent) {
      this.emit("cleared");
    }
  },

  bindItemEvents: function(item) {
    // Bind to model change events, and forward from the collection
    this.boundOnItemChanged = _.bind(this.onItemChanged, this);
    item.on("changed", this.boundOnItemChanged);
  },

  unbindItemEvents: function(item) {
    if (!item || !this.boundOnItemChanged) {
      return;
    }
    item.removeListener("changed", this.boundOnItemChanged);
  },

  /**
   * Forwards item "changed" events as "item:changed" events from the collection
   */
  onItemChanged: function(item) {
    this.emit("item:changed", item);
  }
});
