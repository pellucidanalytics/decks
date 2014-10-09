var _ = require("lodash");
var services = require("./services");
var binder = require("./events").binder;
var DecksEvent = require("./events").DecksEvent;
var Item = require("./item");

/**
 * Represents a collection of Items
 *
 * @constructor
 * @mixes binder
 * @param {(Item[]|Object[])} items items with which to initialize collection
 */
function ItemCollection(items) {
  if (!(this instanceof ItemCollection)) { return new ItemCollection(items); }
  items = items || [];

  this._items = {};
  this.addItems(items);
}

_.extend(ItemCollection.prototype, binder, /** @lends ItemCollection.prototype */ {
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
      this.index();
    }

    if (!options.silent) {
      services.emitter.emit(DecksEvent("item:collection:item:added", this, item));
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

    if (_.isEmpty(items)) { return; }

    // Don't re-index the collection with each added item, re-index it all at the end
    var originalNoIndex = options.noIndex;
    options.noIndex = true;

    _.each(items, function(item) {
      this.addItem(item, options);
    }, this);

    options.noIndex = originalNoIndex;

    if (!options.noIndex) {
      this.index();
    }

    if (!options.silent) {
      services.emitter.emit("item:collection:items:added");
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

    delete this._items[item.id];

    if (!options.noIndex) {
      this.index();
    }

    if (!options.silent) {
      services.emitter.emit(DecksEvent("item:collection:item:removed", this, item));
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
      services.emitter.emit(DecksEvent("item:collection:cleared", this));
    }
  },

  setFilter: function(filter, options) {
    options = options || {};

    if (this.filter === filter) { return; }

    this.filter = filter;

    if (!options.noIndex) {
      this.index();
    }

    if (!options.silent) {
      services.emitter.emit(DecksEvent("item:collection:filter:changed", this, this.filter));
    }
  },

  setSortBy: function(sortBy, options) {
    options = options || {};

    if (this.sortBy === sortBy) { return; }

    this.sortBy = sortBy;

    if (!options.noIndex) {
      this.index();
    }

    if (!options.silent) {
      services.emitter.emit(DecksEvent("item:collection:sortBy:changed", this, this.sortBy));
    }
  },

  setReversed: function(isReversed, options) {
    options = options || {};

    if (this.isReversed === isReversed) { return; }

    this.isReversed = isReversed;

    if (!options.noIndex) {
      this.index();
    }

    if (!options.silent) {
      services.emitter.emit(DecksEvent("item:collection:isReversed:changed", this, this.isReversed));
    }
  },

  index: function() {
    // TODO: could probably cache the referenceItems, and dump the cache anytime
    // filter, sortBy is changed, or the collection is changed.

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

    var items = this.getItems();
    _.each(items, function(item) {
      var index = _.indexOf(referenceItems, item);
      item.setIndex(index);
    });

    services.emitter.emit(DecksEvent("item:collection:indexed", this));
  }
});

module.exports = ItemCollection;
