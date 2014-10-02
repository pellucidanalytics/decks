var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");

function Item(data) {
  if (!(this instanceof Item)) { return new Item(data); }
  EventEmitter.call(this);
  this._data = {};
  if (data) {
    this.setData(data);
  }
}

inherits(Item, EventEmitter);

_.extend(Item.prototype, {
  get: function(key) {
    return this._data[key];
  },

  set: function(key, value, options) {
    options = options || {};

    if (_.isEqual(this._data[key], value) && !options.force) {
      return;
    }

    var oldValue = this.get(key);
    this._data[key] = value;

    if (!options.silent) {
      this.emit("changed", { key: key, oldValue: oldValue, newValue: value });
    }
  },

  getData: function() {
    return this._data;
  },

  setData: function(data, options) {
    data = data || {};
    options = options || {};

    if (!options.noClear) {
      this.clear(options);
    }

    _.each(data, function(value, key) {
      this.set(key, value, options);
    }, this);
  },

  clear: function(options) {
    options = options || {};

    this._data = {};

    if (!options.silent) {
      this.emit("cleared");
    }
  }
});

module.exports = Item;
