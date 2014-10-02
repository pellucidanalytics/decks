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
  /**
   * Gets a data value by key
   */
  get: function(key) {
    return this._data[key];
  },

  /**
   * Sets a data value by key
   */
  set: function(key, value, options) {
    options = options || {};

    if (_.isEqual(this._data[key], value) && !options.force) {
      return;
    }

    var oldValue = this.get(key);
    this._data[key] = value;

    if (!options.silent) {
      this.emit("changed", { item: this, key: key, value: value, oldValue: oldValue });
    }
  },

  /**
   * Gets the full data object
   */
  getData: function() {
    return this._data;
  },

  /**
   * Sets the full data object
   */
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

  /**
   * Clears the data object
   */
  clear: function(options) {
    options = options || {};

    this._data = {};

    if (!options.silent) {
      this.emit("cleared", { item: this });
    }
  }
});

module.exports = Item;
