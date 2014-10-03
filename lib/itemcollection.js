var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");
var Item = require("./item");
var eventBinder = require("./util").eventBinder;

function ItemCollection(items, options) {
  if (!(this instanceof ItemCollection)) { return new ItemCollection(items, options); }
  EventEmitter.call(this);
  eventBinder.addTo(this);

  this._items = [];

  if (_.isArray(items)) {
    this.addItems(items);
  }
}

inherits(ItemCollection, EventEmitter);

_.extend(ItemCollection.prototype, {

  indexOf: function(item) {
    return _.indexOf(this._items, item);
  },

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

  getItems: function(filter) {
    if (filter) {
      return _.filter(this._items, filter);
    }
    return this._items;
  },

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
      this.emit("item:added", { item: item, index: index });
    }
  },

  addItems: function(items, options) {
    if (!_.isArray(items)) { throw new Error("items are required"); }

    _.each(items, function(item) {
      this.addItem(item, options);
    }, this);
  },

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
      this.emit("item:removed", { item: item, index: index });
    }
  },

  clear: function(options) {
    options = options || {};

    _.each(this._items, function(item) {
      this.removeItem(item, options);
    }, this);

    if (!options.silent) {
      this.emit("cleared");
    }
  },

  _itemEventMap: {
    "item:changed": "_onItemChanged"
  },

  _onItemChanged: function(data) {
    data.index = this.indexOf(item);
    this.emit("item:changed", data);
  }
});

module.exports = ItemCollection;
