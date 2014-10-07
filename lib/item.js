var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");

/**
 * Manages a data object and adds an event API for setting values
 *
 * @constructor
 * @augments EventEmitter2
 * @param {Object} data object containing arbitrary data
 */
function Item(data) {
  if (!(this instanceof Item)) { return new Item(data); }
  EventEmitter.call(this);
  data = data || {};

  this.id = null;
  this._data = {};

  this.setId(data);
  this.setData(data);
}

inherits(Item, EventEmitter);

_.extend(Item.prototype, {
  /**
   * Sets the Item's unique ID
   *
   * @param {(String|Object)} data the id string value, or an object which contains an id-like key
   * @return {undefined}
   */
  setId: function(data) {
    if (_.isString(this.id)) { throw new Error("id cannot be changed"); }

    if (_.isString(data)) {
      this.id = data;
      return;
    }

    if (_.isNumber(data)) {
      this.id = "" + data;
      return;
    }

    var key = _.find(["id", "_id", "Id", "ID"], function(key) {
      return _.has(data, key);
    });

    if (key) {
      this.id = "" + data[key];
      return;
    }

    this.id = "" + _.uniqueId();
  },
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
