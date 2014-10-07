var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");
var Item = require("./item");
var eventBinder = require("./util").eventBinder;

/**
 * Represents a collection of Items
 *
 * @constructor
 * @augments EventEmitter2
 * @mixes eventBinder
 * @param {(Item[]|Object[])} items items with which to initialize collection
 * @param {Object} options additional options
 */
function ItemCollection(items, options) {
  if (!(this instanceof ItemCollection)) { return new ItemCollection(items, options); }
  EventEmitter.call(this);

  this._items = {};

  if (_.isArray(items)) {
    this.addItems(items);
  }
}

inherits(ItemCollection, EventEmitter);

_.extend(ItemCollection.prototype, eventBinder, /** @lends ItemCollection.prototype */ {
  /**
   * Gets a single item from the collection
   *
   * @param {String} id Item id to find
   * @return {Item} Item or null if not found
   */
  getItem: function(id) {
    if (_.isNumber(id)) {
      id = "" + id;
    }
    return this._items[id];
  },

  /**
   * Gets multiple items from the collection
   *
   * @return {Item[]} array of items (not a collection instance)
   */
  getItems: function() {
    return _.values(this._items);
  },

  /**
   * Adds an item to the collection
   *
   * @param {(Item|Object)} item item to add
   * @param {?Object} options additional options
   * @return {undefined}
   */
  addItem: function(item, options) {
    if (!item) { throw new Error("item is required"); }
    options = options || {};

    if (!(item instanceof Item)) {
      item = new Item(item);
    }

    this._items[item.id] = item;

    this.bindEvents(item, this._itemEventMap);

    if (!options.silent) {
      this.emit("item:collection:item:added", { item: item });
    }
  },

  /**
   * Adds an array of items to the collection
   *
   * @param {(Item[]|Object[])} items items to add
   * @param {?Object} options additional options
   * @return {undefined}
   */
  addItems: function(items, options) {
    if (!_.isArray(items)) { throw new Error("items are required"); }
    options = options || {};

    _.each(items, function(item) {
      this.addItem(item, options);
    }, this);

    if (!options.silent) {
      this.emit("item:collection:items:added");
    }
  },

  /**
   * Removes an item from the collection
   *
   * @param {Item} item item to remove
   * @param {?Object} options additional options
   * @return {undefined}
   */
  removeItem: function(item, options) {
    if (!item) { throw new Error("item is required"); }
    options = options || {};

    if (!_.has(this._items, item.id)) {
      return;
    }

    this.unbindEvents(item, this._itemEventMap);

    delete this._items[item.id];

    if (!options.silent) {
      this.emit("item:collection:item:removed", { item: item });
    }
  },

  /**
   * Clears the collection
   *
   * @param {?Object} options additional options
   * @return {undefined}
   */
  clear: function(options) {
    options = options || {};

    _.each(this._items, function(item) {
      this.removeItem(item, options);
    }, this);

    if (!options.silent) {
      this.emit("item:collection:cleared");
    }
  },

  _itemEventMap: {
    "item:changed": "_onItemChanged"
  },

  _onItemChanged: function(data) {
    this.emit("item:collection:item:changed", data);
  }
});

module.exports = ItemCollection;
