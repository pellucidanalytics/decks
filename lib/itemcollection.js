var _ = require("lodash");
var hasEmitter = require("./events").hasEmitter;
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
function ItemCollection(items, options) {
  if (!(this instanceof ItemCollection)) { return new ItemCollection(items); }
  items = items || [];
  options = _.merge({}, this.defaultOptions, options);
  this.setEmitter(options.emitter || {});
  this.items = {};
  this.addItems(items);
}

_.extend(ItemCollection.prototype, binder, hasEmitter, /** @lends ItemCollection.prototype */ {
  defaultOptions: {
  },

  itemEvents: {
    "*": "onItemEvent"
  },

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
    return this.items[id];
  },

  /**
   * Gets multiple items from the collection
   *
   * @return {Item[]} array of items (not a collection instance)
   */
  getItems: function() {
    return _.values(this.items);
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

    if (this.items[item.id]) { throw new Error("collection already contains an item with id " + item.id); }

    this.items[item.id] = item;

    this.bindEvents(item, this.itemEvents);

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:item:added", this, item));
    }

    if (!options.noIndex) {
      this.index();
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

    _.each(items, function(item) {
      this.addItem(item, { noIndex: true });
    }, this);

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:items:added", this));
    }

    if (!options.noIndex) {
      this.index();
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

    if (!_.has(this.items, item.id)) {
      return;
    }

    this.unbindEvents(item, this.itemEvents);
    delete this.items[item.id];

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:item:removed", this, item));
    }

    if (!options.noIndex) {
      this.index();
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

    if (_.isEqual(this.items, {})) { return; }

    _.each(this.items, function(item) {
      this.removeItem(item, { noIndex: true });
    }, this);

    // No need to re-index the collection, because it's now empty

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:cleared", this));
    }
  },

  setFilter: function(filter, options) {
    options = options || {};

    if (this.filter === filter) { return; }

    this.filter = filter;

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:filter:changed", this, this.filter));
    }

    if (!options.noIndex) {
      this.index();
    }
  },

  setSortBy: function(sortBy, options) {
    options = options || {};

    if (this.sortBy === sortBy) { return; }

    this.sortBy = sortBy;

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:sortBy:changed", this, this.sortBy));
    }

    if (!options.noIndex) {
      this.index();
    }
  },

  setReversed: function(isReversed, options) {
    options = options || {};

    if (this.isReversed === isReversed) { return; }

    this.isReversed = isReversed;

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:isReversed:changed", this, this.isReversed));
    }

    if (!options.noIndex) {
      this.index();
    }
  },

  index: function() {
    // Create a list of filtered, sorted, and reversed items, then find the index of each item
    // in the reference list.  If the item is not in the ref list, it will get an index of -1,
    // which means it should not be drawn (or should be hidden).

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

    this.emit(DecksEvent("item:collection:indexed", this));
  },

  onItemEvent: function(e) {
    this.emit(e);
  }
});

module.exports = ItemCollection;
