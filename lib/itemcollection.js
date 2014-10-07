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

  this._items = [];

  if (_.isArray(items)) {
    this.addItems(items);
  }
}

inherits(ItemCollection, EventEmitter);

_.extend(ItemCollection.prototype, eventBinder, /** @lends ItemCollection.prototype */ {
  /**
   * Gets the index of an item in the collection.  If the index parameter
   * is passed, it will be returned.
   *
   * @param {Item} item item to locate
   * @param {Number} index optional index to pass
   * @return {Number} index of item in collection
   */
  indexOf: function(item, index) {
    if (_.isNumber(index)) {
      return index;
    }
    return _.indexOf(this._items, item);
  },

  /**
   * Gets a single item from the collection
   *
   * @param {(Number|Function(Item))} filter index or find function
   * @return {Item} Item or null if not found
   */
  getItem: function(filter) {
    if (_.isNumber(filter)) {
      return this._items[filter];
    }

    if (_.isFunction(filter)) {
      return _.find(this._items, filter);
    }

    if (this._items.length) {
      return this._items[0];
    }

    return null;
  },

  /**
   * Gets multiple items from the collection
   *
   * @param {Function(item)} filter filtering function - if not specified, all items will be returned
   * @return {Item[]} array of items (not a collection instance)
   */
  getItems: function(filter) {
    if (_.isFunction(filter)) {
      return _.filter(this._items, filter);
    }
    return this._items;
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

    this._items.push(item);
    var index = this.indexOf(item);

    this.bindEvents(item, this._itemEventMap);

    if (!options.silent) {
      this.emit("item:collection:item:added", { item: item, index: index });
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

    _.each(items, function(item) {
      this.addItem(item, options);
    }, this);
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

    if (!_.contains(this._items, item)) {
      return;
    }

    this.unbindEvents(item, this._itemEventMap);

    var index = this.indexOf(item);

    this._items = _.without(this._items, item); // TODO: splice?

    if (!options.silent) {
      this.emit("item:collection:item:removed", { item: item, index: index });
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
    // add the Item index to the event, and re-emit
    data.index = this.indexOf(item);
    this.emit("item:collection:item:changed", data);
  }
});

module.exports = ItemCollection;
