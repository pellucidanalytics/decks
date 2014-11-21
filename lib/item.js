var _ = require("lodash");
var hasEmitter = require("./events").hasEmitter;
var DecksEvent = require("./events").DecksEvent;
var validate = require("./utils/validate");

/**
 * Manages a data object and adds an event API for setting values
 *
 * @class
 * @mixes hasEmitter
 * @param {Object} [data={}] object containing arbitrary data
 */
function Item(data, options) {
  if (!(this instanceof Item)) {
    return new Item(data);
  }

  data = data || {};
  options = _.merge({}, this.defaultOptions, options);

  this.setEmitter(options.emitter || {});
  this.setId(data);
  this.setIndex(data, { silent: true });
  this.setData(data, { silent: true });
}

_.extend(Item.prototype, hasEmitter, /** @lends Item.prototype */ {
  defaultOptions: {
  },

  /**
   * Sets the Item's unique ID.
   *
   * This is required for indexing the item in various data structures in decks.js.
   *
   * @param {(String|Number|Object)} data the id string value, id numeric value, or an object which contains an id key
   * @return {undefined}
   */
  setId: function(data) {
    if (_.isString(this.id)) {
      throw new Error("Item#setId: Item id cannot be changed");
    }

    if (_.isString(data)) {
      this.id = data;
      return;
    }

    if (_.isNumber(data)) {
      this.id = "" + data; // convert to string
      return;
    }

    // look for possible id properties in the data object
    var key = _.find(["id", "_id", "Id", "ID"], function(key) {
      return _.has(data, key) && (_.isNumber(data[key]) || _.isString(data[key]));
    });

    if (key && (_.isString(data[key]) || _.isNumber(data[key]))) {
      this.id = "" + data[key]; // convert to string
      return;
    }

    // default to generated unique ID
    this.id = "" + _.uniqueId();
  },

  /**
   * Sets the Item's index
   *
   * @param {!(Number|Object)} data numeric index value or an object with a numeric index property
   * @param {?Object} options additional options
   * @return {boolean} whether the index was changed (true: was changed, false: was not changed)
   */
  setIndex: function(data, options) {
    options = options || {};

    var index = -1;

    if (_.isNumber(data)) {
      index = data;
    } else if (_.has(data, "index") && _.isNumber(data.index)) {
      index = data.index;
    }

    if (this.index === index) {
      return false;
    }

    this.index = index;

    if (!options.silent) {
      this.emit(DecksEvent("item:index:changed", this, this.index));
    }

    return true;
  },

  /**
   * Gets a single property value by key
   *
   * @param {String} key property key
   * @return {*} property value
   */
  get: function(key) {
    validate(key, "key", { isString: true });

    return this.data[key];
  },

  /**
   * Sets a single property value by key
   *
   * @param {String} key property key
   * @param {*} value property value
   * @param {?Object} options additional options
   * @return {undefined}
   */
  set: function(key, value, options) {
    validate(key, "key", { isString: true });

    options = options || {};

    if (_.isEqual(this.data[key], value)) {
      return;
    }

    var oldValue = this.get(key);
    this.data[key] = value;

    if (!options.silent) {
      this.emit(DecksEvent("item:changed", this, { key: key, value: value, oldValue: oldValue }));
    }
  },

  /**
   * Gets the full data object
   *
   * @return {Object}
   */
  getData: function() {
    return this.data;
  },

  /**
   * Sets the full data object
   *
   * @param {Object} data data object to set
   * @param {?Object} options additional options
   * @return {undefined}
   */
  setData: function(data, options) {
    data = data || {};
    options = options || {};
    var oldData = this.getData();

    if (_.isEqual(oldData, data)) {
      return;
    }

    this.data = data;

    if (!options.silent) {
      this.emit(DecksEvent("item:changed", this, { oldData: oldData, data: data }));
    }
  },

  /**
   * Clears the data object (sets to empty object)
   *
   * @param {Object} [options={}] - Additional options
   * @param {boolean} options.silent - If true, do not emit event after clear
   * @return {undefined}
   */
  clear: function(options) {
    options = options || {};
    var oldData = this.getData();

    if (_.isEmpty(oldData)) {
      return;
    }

    this.data = {};

    if (!options.silent) {
      this.emit("item:cleared", this);
    }
  }
});

module.exports = Item;
