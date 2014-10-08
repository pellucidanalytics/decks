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

    if (!options.noIndex) {
      this.indexCollection();
    }

    // Bind events after this.indexCollection()
    this.bindEvents(item, this._itemEventMap);

    if (!options.silent) {
      this.emit("item:collection:item:added", item);
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

    // Don't re-index the collection with each added item, re-index it all at the end
    var originalNoIndex = options.noIndex;
    options.noIndex = true;

    _.each(items, function(item) {
      this.addItem(item, options);
    }, this);

    options.noIndex = originalNoIndex;

    if (!options.noIndex) {
      this.indexCollection();
    }

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

    if (!options.noIndex) {
      this.indexCollection();
    }

    if (!options.silent) {
      this.emit("item:collection:item:removed", item);
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

    options.noIndex = true;

    _.each(this._items, function(item) {
      this.removeItem(item, options);
    }, this);

    // No need to re-index the collection, because it's now empty

    if (!options.silent) {
      this.emit("item:collection:cleared");
    }
  },

  setFilter: function(filter, options) {
    options = options || {};

    if (this.filter === filter) { return; }

    this.filter = filter;

    if (!options.noIndex) {
      this.indexCollection();
    }

    if (!options.silent) {
      this.emit("item:collection:filter:changed", this.filter);
    }
  },

  setSortBy: function(sortBy, options) {
    options = options || {};

    if (this.sortBy === sortBy) { return; }

    this.sortBy = sortBy;

    if (!options.noIndex) {
      this.indexCollection();
    }

    if (!options.silent) {
      this.emit("item:collection:sortBy:changed", this.sortBy);
    }
  },

  setReversed: function(isReversed, options) {
    options = options || {};

    if (this.isReversed === isReversed) { return; }

    this.isReversed = isReversed;

    if (!options.noIndex) {
      this.indexCollection();
    }

    if (!options.silent) {
      this.emit("item:collection:isReversed:changed", this.isReversed);
    }
  },

  indexCollection: function() {
    //console.log("item collection: indexing collection");

    // TODO: could probably cache the referenceItems, and dump the cache anytime
    // filter, sortBy is changed, or the collection is changed.

    // Get the filtered and sorted list of items
    var referenceItems = _(this.getItems());
    if (this.filter) {
      referenceItems = referenceItems.filter(this.filter);
    }
    if (this.sortBy) {
      referenceItems = referenceItems.sortBy(this.sortBy);
    }
    if (this.isReversed) {
      referenceItems = referenceItems.reverse();
    }
    referenceItems = referenceItems.value();

    // Loop over each item, and find its index in the reference items
    var items = this.getItems();
    _.each(items, function(item) {
      var index = _.indexOf(referenceItems, item);
      //console.log("item collection: setting item " + item.id + " index " + index);
      item.setIndex(index);
    });
  },

  _itemEventMap: {
    "item:changed": "_onItemChanged",
    "item:index:changed": "_onItemIndexChanged"
  },

  _onItemChanged: function(data) {
    this.emit("item:collection:item:changed", data);
  },

  _onItemIndexChanged: function(data) {
    this.emit("item:collection:item:index:changed", data);
  }
});

module.exports = ItemCollection;
