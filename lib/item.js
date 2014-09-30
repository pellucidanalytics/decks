var _ = require("lodash");
var EventEmitter = require("events").EventEmitter;
var util = require("util");

function Item(data) {
  if (!(this instanceof Item)) { return new Item(data); }
  EventEmitter.call(this);
  this._data = data || {};
  this._renders = {};
}

util.inherits(Item, EventEmitter);

_.extend(Item.prototype, {
  /**
   * Gets a data property value from the item
   */
  get: function(key) {
    return this._data[key];
  },

  /**
   * Sets a data property value on the item
   *
   * Events
   * - "changed"
   */
  set: function(key, value, options) {
    options = options || {};
    if (this.data[key] === value && !options.force) {
      return;
    }
    var oldValue = this.get(key);
    this._data[key] = value;
    this.emit("changed", { key: key, oldValue: oldValue, newValue: value });
  },

  /**
   * Indicates if the item has a render for the given key
   */
  hasRender: function(key) {
    return !!this.getRender(key);
  },

  /**
   * Gets the render object for the given key
   */
  getRender: function(key) {
    return this._renders[key];
  },

  /**
   * Adds a render object for the given key
   *
   * Events
   * - "render:added"
   */
  addRender: function(key, render, options) {
    options = options || {};

    this._renders[key] = render;

    if (!options.silent) {
      this.emit("render:added", { key: key, render: render });
    }
  },

  /**
   * Adds the given renders to the item
   */
  addRenders: function(renders, options) {
    _.each(renders, function(render, key) {
      this.addRender(key, render, options);
    }, this);
  },

  /**
   * Clears current renders then sets new renders
   *
   * Events
   * - "render:removed"
   * - "renders:cleared"
   * - "render:added"
   * - "renders:set"
   */
  setRenders: function(renders, options) {
    options = options || {};

    this.clearRenders(options);
    this.addRenders(renders, options);

    if (!options.silent) {
      this.emit("renders:set");
    }
  },

  /**
   * Removes a render object for the given key
   */
  removeRender: function(key, options) {
    options = options || {};

    delete this._renders[key];

    if (!options.silent) {
      this.emit("render:removed", { key: key });
    }
  },

  /**
   * Clears all the current renders
   */
  clearRenders: function(options) {
    options = options || {};

    _.each(this._renders, function(render, key) {
      this.removeRender(key, options);
    }, this);

    if (!options.silent) {
      this.emit("renders:cleared");
    }
  }
});

module.exports = Item;
