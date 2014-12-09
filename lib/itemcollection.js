var _ = require("lodash");
var hasEmitter = require("./events").hasEmitter;
var binder = require("./events").binder;
var DecksEvent = require("./events").DecksEvent;
var Item = require("./item");
var validate = require("./utils/validate");

/**
 * Represents a collection of Items
 *
 * @class
 * @mixes binder
 * @param {(Item[]|Object[])} items items with which to initialize collection
 */
function ItemCollection(items, options) {
  if (!(this instanceof ItemCollection)) {
    return new ItemCollection(items);
  }

  items = items || [];
  options = _.merge({}, this.defaultOptions, options);

  this.setEmitter(options.emitter || {});
  this.items = {};
  this.addItems(items);

  this.emit(DecksEvent("item:collection:ready", this));
}

_.extend(ItemCollection.prototype, binder, hasEmitter, /** @lends ItemCollection.prototype */ {
  /**
   * Default options for ItemCollection instances
   */
  defaultOptions: {
  },

  /**
   * Item events to which to bind for each Item added to the collection.
   *
   * @return {undefined}
   */
  getItemEvents: function() {
    return {
      "*": "onAnyItemEvent"
    };
  },

  /**
   * Gets a single item from the collection
   *
   * @param {!String} id - Item id to find
   * @return {Item} - Item or null if not found
   */
  getItem: function getItem(id) {
    if (_.isNumber(id)) {
      id = "" + id;
    }

    validate(id, "id", { isString: true });

    return this.items[id];
  },

  /**
   * Gets all {@link Item}s from the collection, or a subset of {@link Item}s based on an optional filter function.
   *
   * @param {?Function} filter - the filter predicate function (takes an item and should return whether Item passes the filter)
   * @return {Item[]} - Array of {@link Item}s (not an {@link ItemCollection} instance)
   */
  getItems: function getItems(filter) {
    var items = _.values(this.items);

    if (filter) {
      items = _.filter(items, filter);
    }

    return items;
  },

  /**
   * Adds an {@link Item} to the {@link ItemCollection}.
   *
   * An event is emitted just before adding the {@link Item} and just after.
   *
   * After adding the {@link Item} the {@link ItemCollection} is re-indexed, based on the current
   * filter function, sortBy function, and reversed flag.
   *
   * @param {!(Item|Object)} item - item instance or options to add
   * @param {?Object} [options={}] - additional options
   * @param {?boolean} [options.silent=false] - if true, the {@link ItemCollection} will not emit events
   * @param {?boolean} [options.noIndex=false] - if true, the {@link ItemCollection} will not be re-indexed after adding the {@link Item}
   * @return {Item} - the {@link Item} instance that was added
   */
  addItem: function addItem(item, options) {
    validate(item, "item", { isRequired: true });

    options = options || {};

    if (!(item instanceof Item)) {
      item = new Item(item);
    }

    if (this.items[item.id]) {
      throw new Error("ItemCollection#addItem: collection already contains an item with id " + item.id);
    }

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:item:adding", this, item));
    }

    this.items[item.id] = item;
    this.bindEvents(item, this.getItemEvents());

    if (!options.noIndex) {
      this.index({ isAddItem: true }, { silent: options.silent });
    }

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:item:added", this, item));
    }

    return item;
  },

  /**
   * Adds an array of items to the collection.
   *
   * Events and indexing will be suppressed for each individual {@link Item} added.
   *
   * @param {!(Item[]|Object[])} items - Array of {@link Item} instances or options objects to add
   * @param {?Object} [options={}] - additional options
   * @param {?boolean} [options.silent=false] - if true, no events will be emitted
   * @param {?boolean} [options.noIndex=false] - if true, the {@link ItemCollection} will not be re-indexed
   * @return {Item[]} - Array of {@link Item} instances that were added.
   */
  addItems: function addItems(items, options) {
    validate(items, "items", { isArray: true });

    options = options || {};

    if (_.isEmpty(items)) {
      return;
    }

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:items:adding", this));
    }

    items = _.map(items, function(item) {
      return this.addItem(item, { silent: true, noIndex: true });
    }, this);

    if (!options.noIndex) {
      this.index({ isAddItems: true }, { silent: options.silent });
    }

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:items:added", this, items));
    }

    return items;
  },

  /**
   * Removes an item from the collection
   *
   * @param {Item} item item to remove
   * @param {?Object} options additional options
   * @return {undefined}
   */
  removeItem: function removeItem(item, options) {
    validate(item, "item", { isInstanceOf: Item });

    options = options || {};

    if (!_.has(this.items, item.id)) {
      return;
    }

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:item:removing", this, item));
    }

    this.unbindEvents(item, this.getItemEvents());
    delete this.items[item.id];

    if (!options.noIndex) {
      this.index({ isRemoveItem: true }, { silent: options.silent });
    }

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:item:removed", this, item));
    }

    return item;
  },

  /**
   * Clears the collection by removing all the {@link Item}s one-by-one.
   *
   * Events and indexing will be suppressed for each individual {@link Item} removed.
   *
   * @param {?Object} options additional options
   * @return {undefined}
   */
  clear: function clear(options) {
    options = options || {};

    if (_.isEmpty(this.items)) {
      return;
    }

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:clearing", this));
    }

    var items = _.map(this.items, function(item) {
      return this.removeItem(item, { silent: true, noIndex: true });
    }, this);

    // There's not really a need to re-index the collection, but some things rely
    // on the indexing events being emitted
    if (!options.noIndex) {
      this.index({ isClear: true }, { silent: options.silent });
    }

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:cleared", this, items));
    }

    return items;
  },

  /**
   * Sets or clears the current filter function.
   *
   * The filter function is used to filter {@link Item}s out of the {@link ItemCollection} based
   * on a predicate.  The {@link Item}s are marked as filtered-out by setting the {@link Item} index
   * to -1 (they are not actually removed from the collection, just flagged in this way).
   *
   * @param {?Function} [filter=null] - the filter function (or null to clear the current filter)
   * @param {?Object} [options={}] - additional options
   * @param {?boolean} [options.silent=false] - if true, events will not be emitted
   * @param {?boolean} [options.noIndex=false] - if true, the collection will not be re-indexed with the new filter
   * @return {undefined}
   */
  setFilter: function setFilter(filter, options) {
    if (!_.isFunction(filter)) {
      filter = null;
    }

    options = options || {};

    if (this.filter === filter) {
      return;
    }

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:filter:setting", this, { oldFilter: this.filter, newFilter: filter }));
    }

    this.filter = filter;

    if (!options.noIndex) {
      this.index({ isSetFilter: true }, { silent: options.silent });
    }

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:filter:set", this, this.filter));
    }
  },

  /**
   * Sets or clears the current sort by function.
   *
   * The sort by function is used to sort the {@link Item}s in the collection.
   * The sortBy function should return a sortable value for each {@link Item}.
   * The sort is applied by updating the {@link Item} index values.
   *
   * @param {?Function} [sortBy=null] - the sort by function (or null to clear the current sort)
   * @param {?Object} [options={}] - additional options
   * @param {?boolean} [options.silent=false] - if true, events will not be emitted
   * @param {?boolean} [options.noIndex=false] - if true, the collection will not be re-indexed with the new sort
   * @return {undefined}
   */
  setSortBy: function setSortBy(sortBy, options) {
    if (!_.isFunction(sortBy)) {
      sortBy = null;
    }

    options = options || {};

    if (this.sortBy === sortBy) {
      return;
    }

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:sort:by:setting", this, { oldSortBy: this.sortBy, newSortBy: sortBy }));
    }

    this.sortBy = sortBy;

    if (!options.noIndex) {
      this.index({ isSetSortBy: true }, { silent: options.silent });
    }

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:sort:by:set", this, this.sortBy));
    }
  },

  /**
   * Reverses the sort on the collection.
   *
   * The reversing is applied by re-indexing all the {@link Item}s in the {@link ItemCollection}.
   *
   * @param {?boolean} [isReversed=false] - whether the collection should be reversed.
   * @param {?Object} [options={}] - additional options
   * @param {?boolean} [options.silent=false] - if true, events will not be emitted
   * @param {?boolean} [options.noIndex=false] - if true, the collection will not be re-indexed with the new reverse value.
   * @return {undefined}
   */
  setReversed: function setReversed(isReversed, options) {
    isReversed = !!isReversed;
    options = options || {};

    if (this.isReversed === isReversed) {
      return;
    }

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:reversed:setting", this, { oldIsReversed: this.isReversed, newIsReversed: isReversed }));
    }

    this.isReversed = isReversed;

    if (!options.noIndex) {
      this.index({ isSetReversed: true }, { silent: options.silent });
    }

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:reversed:set", this, this.isReversed));
    }
  },

  /**
   * Indexes the {@link ItemCollection} based on the current filter function, sortBy function, and
   * reversed flag.  Each {@link Item} in the collection will have it's index value set based on
   * the filter/sortBy/reversed representation of the {@link ItemCollection} items.
   *
   * The sorting and filtering is applied to the {@link Item}s by updating the {@link Item} index values.
   * {@link Item}s are not physically moved or removed from the {@link ItemCollection}.
   *
   * If {@link Item}s are filtered out via the filter function, the {@link Item} index will be set to
   * -1.  The {@link Layout#getRenders} method can check if item.index is -1 to decide if the {@link Item}
   *  should be displayed.
   *
   * @param {!Object} reason - an object which indicates why the collection is being indexed
   * @param {?Object} options - additional options
   * @param {?boolean} [options.silent=false] - if true, no events will be emitted
   * @return {undefined}
   */
  index: function index(reason, options) {
    validate(reason, "reason", { isRequired: true });
    options = options || {};

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

    var totalCount = items.length;
    var referenceCount = referenceItems.length;

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:indexing", this, {
        reason: reason,
        totalCount: totalCount,
        referenceCount: referenceCount
      }));
    }

    var changedCount = _.reduce(items, function indexItem(count, item) {
      var index = _.indexOf(referenceItems, item);
      if (item.setIndex(index, { silent: options.silent })) {
        count++;
      }
      return count;
    }, 0);

    if (!options.silent) {
      this.emit(DecksEvent("item:collection:indexed", this, {
        reason: reason,
        totalCount: totalCount,
        referenceCount: referenceCount,
        changedCount: changedCount
      }));
    }
  },

  /**
   * Called for {@link Item} events.  Forwards the {@link Item} events via the {@ItemCollection}
   * emitter.
   *
   * @param e
   * @return {undefined}
   */
  onAnyItemEvent: function onAnyItemEvent(e) {
    this.emit(e);
  }
});

module.exports = ItemCollection;
