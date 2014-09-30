var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");

function Item(data) {
  if (!(this instanceof Item)) { return new Item(data); }
  EventEmitter.call(this);
  this._data = data || {};
  this._renders = {};
}

inherits(Item, EventEmitter);

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

    // if value is not changing, ignore (unless options.force)
    if (_.isEqual(this._data[key], value) && !options.force) {
      return;
    }

    var oldValue = this.get(key);
    this._data[key] = value;

    if (!options.silent) {
      this.emit("changed", { key: key, oldValue: oldValue, newValue: value });
    }
  },

  /**
   * Indicates if the item has a render for the given key
   */
  hasRender: function(key) {
    return !!this.getRender(key);
  },

  /**
   * Indicates if the item has one or more renders
   */
  hasRenders: function() {
    return !!_.keys(this._renders).length;
  },

  /**
   * Gets the render object for the given key
   */
  getRender: function(key) {
    return this._renders[key];
  },

  /**
   * Sets a render object for the given key
   */
  setRender: function(key, render, options) {
    options = options || {};

    var currentRender = this.getRender(key);

    // if render is not changing, ignore (unless options.force)
    if (currentRender && _.isEqual(currentRender, render) && !options.force) {
      return;
    }

    // remove the current render
    if (currentRender) {
      this.removeRender(key, options);
    }

    // set the new render
    this._renders[key] = render;

    if (!options.silent) {
      this.emit("render:set", { key: key, render: render });
    }
  },

  /**
   * Adds the given renders to the item
   */
  setRenders: function(renders, options) {
    options = options || {};


    // clear the current renders by default
    // TODO: might be better to determine which specific keys need to be removed, remove those, then
    // just call setRender for keys that are in both the current renders and the new renders
    if (!options.noClear) {
      this.clearRenders(options);
    }

    _.each(renders, function(render, key) {
      this.setRender(key, render, options);
    }, this);

    if (!options.silent) {
      this.emit("renders:set", { renders: renders });
    }
  },

  /**
   * Removes a render object for the given key
   */
  removeRender: function(key, options) {
    options = options || {};

    var render = this.getRender(key);

    if (!render) {
      return;
    }

    delete this._renders[key];

    if (!options.silent) {
      this.emit("render:removed", { key: key, render: render });
    }
  },

  /**
   * Clears all the current renders
   */
  clearRenders: function(options) {
    options = options || {};

    if (!this.hasRenders()) {
      return;
    }

    _.each(this._renders, function(render, key) {
      this.removeRender(key, options);
    }, this);

    if (!options.silent) {
      this.emit("renders:cleared");
    }
  }
});

module.exports = Item;
