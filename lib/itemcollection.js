var _ = require("lodash");
var EventEmitter = require("events").EventEmitter;
var util = require("util");
var Item = require("./item");

function ItemCollection(items, options) {
  if (!(this instanceof ItemCollection)) { return new ItemCollection(items, options); }
  EventEmitter.call(this);

  // TOOD: maybe use a PourOver Collection here?
  this._items = items || [];
}

util.inherits(ItemCollection, EventEmitter);

_.extend(ItemCollection.prototype, {
  /**
   * Gets a single item by applying a filter (_.find)
   */
  getItem: function(filter) {
    // TODO: does _.find do this automatically?
    if (_.isNumber(filter)) {
      return this._items[filter];
    }

    if (filter) {
      return _.find(this._items, filter);
    }

    if (this._items.length) {
      return this._items[0];
    }

    return null;
  },

  /**
   * Gets the items with optional filter
   */
  getItems: function(filter) {
    if (filter) {
      return _.filter(this._items, filter);
    }

    return this._items;
  },

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

    this._items.push(item);

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
    if (!_.contains(this._items, item)) {
      return;
    }

    this.unbindItemEvents(item);

    this._items = _.without(this._items, item);

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
    _.each(this._items, function(item) {
      this.removeItem(item, options);
    }, this);

    if (!options.silent) {
      this.emit("cleared");
    }
  },

  /**
   * Binds to the item events, so the collection can forward them
   */
  bindItemEvents: function(item) {
    this.boundOnItemChanged = _.bind(this.onItemChanged, this);
    item.on("changed", this.boundOnItemChanged);
  },

  /**
   * Unbinds from item events
   */
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

module.exports = ItemCollection;
