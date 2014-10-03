var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");

function Layout(options) {
  if (!(this instanceof Layout)) { return new Layout(options); }
  EventEmitter.call(this);
  options = options || {};

  // Allow user to set these methods via options (rather than subclassing Layout)
  _.each(["getRenders", "loadRender", "unloadRender"], function(key) {
    if (options[key]) {
      this[key] = options[key];
    }
  }, this);
}

inherits(Layout, EventEmitter);

_.extend(Layout.prototype, {

  getRenders: function(options) {
    throw new Error("getRenders is not implemented");
  },

  loadRender: function(options) {
    throw new Error("loadRender is not implemented");
  },

  unloadRender: function(options) {
    throw new Error("unloadRender is not implemented");
  },

  setViewport: function(viewport, options) {
    if (!viewport) { throw new Error("viewport is required"); }
    options = options || {};

    this.viewport = viewport;

    if (!options.silent) {
      this.emit("viewport:set", this.viewport);
    }
  },

  setItemCollection: function(itemCollection, options) {
    if (!itemCollection) { throw new Error("itemCollection is required"); }
    options = options || {};

    this.itemCollection = itemCollection;

    if (!options.silent) {
      this.emit("item:collection:set", this.itemCollection);
    }
  }
});

module.exports = Layout;
