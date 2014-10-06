var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");

/**
 * Manages a data object and adds an event API for setting values
 *
 * @constructor
 * @param {Object} data object containing arbitrary data
 */
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
   * Gets a single property value by key
   *
   * @memberof Item
   * @instance
   * @param {String} key property key
   * @return {*} property value
   */
  get: function(key) {
    return this._data[key];
  },

  /**
   * Sets a single property value by key
   *
   * @memberof Item
   * @instance
   * @param {String} key property key
   * @param {*} value property value
   * @param {?Object} options additional options
   * @return {undefined}
   */
  set: function(key, value, options) {
    options = options || {};

    if (_.isEqual(this._data[key], value) && !options.force) {
      return;
    }

    var oldValue = this.get(key);
    this._data[key] = value;

    if (!options.silent) {
      this.emit("item:changed", { item: this, key: key, value: value, oldValue: oldValue });
    }
  },

  /**
   * Gets the full data object
   *
   * @memberof Item
   * @instance
   * @return {Object}
   */
  getData: function() {
    return this._data;
  },

  /**
   * Sets the full data object
   *
   * @memberof Item
   * @instance
   * @param {Object} data data object to set
   * @param {?Object} options additional options
   * @return {undefined}
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
   * Clears the data object (sets to empty object)
   *
   * @memberof Item
   * @instance
   * @param options additional options
   * @return {undefined}
   */
  clear: function(options) {
    options = options || {};

    this._data = {};

    if (!options.silent) {
      this.emit("item:cleared", { item: this });
    }
  }
});

module.exports = Item;
