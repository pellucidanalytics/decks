var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");
var Item = require("./item");

function ItemCollection(items, options) {
  if (!(this instanceof ItemCollection)) { return new ItemCollection(items, options); }
  EventEmitter.call(this);
  _.bindAll(this, ["_onItemChanged"]);
  this._items = [];
  if (_.isArray(items)) {
    this.addItems(items);
  }
}

inherits(ItemCollection, EventEmitter);

_.extend(ItemCollection.prototype, {
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
    options = options || {};
    if (!(item instanceof Item)) {
      item = new Item(item);
    }
    this._items.push(item);
    this._bindItemEvents(item);
    if (!options.silent) {
      this.emit("item:added", item);
    }
  },

  addItems: function(items, options) {
    _.each(items, function(item) {
      this.addItem(item, options);
    }, this);
  },

  removeItem: function(item, options) {
    options = options || {};
    if (!_.contains(this._items, item)) {
      return;
    }
    this._unbindItemEvents(item);
    this._items = _.without(this._items, item);
    if (!options.silent) {
      this.emit("item:removed", item);
    }
  },

  clear: function(options) {
    _.each(this._items, function(item) {
      this.removeItem(item, options);
    }, this);
    if (!options.silent) {
      this.emit("cleared");
    }
  },

  _bindItemEvents: function(item) {
    item.on("changed", this.onItemChanged);
  },

  _unbindItemEvents: function(item) {
    if (!item) {
      return;
    }
    item.off("changed", this.onItemChanged);
  },

  _onItemChanged: function(item) {
    this.emit("item:changed", item);
  }
});

module.exports = ItemCollection;
