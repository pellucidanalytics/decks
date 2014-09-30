var _ = require("lodash");
var EventEmitter = require("events").EventEmitter;
var util = require("util");
var ItemRender = require("./itemrender");

function ItemRenderer(options) {
  if (!(this instanceof ItemRenderer)) { return new ItemRenderer(options); }
  if (!_.isFunction(options.loadItem)) { throw new Error("options.loadItem must be a function"); }
  if (!_.isFunction(options.unloadItem)) { throw new Error("options.unloadItem must be a function"); }

  this.loadItem = options.loadItem;
  this.unloadItem = options.unloadItem;

  if (_.isFunction(options.createDefaultRender)) {
    this.createDefaultRender = options.createDefaultRender;
  }
}

_.extend(ItemRenderer.prototype, {

  createDefaultRender: function() {
    return {
      container: document.createElement("div"),
      transform: null
    };
  },

  getItemRender: function(item, key) {
    return item.getRender(key);
  },

  addItemRender: function(item, key, render) {
    render = render || this.createDefaultRender(item, key);
    item.addRender(key, render);
    return item.getRender(key);
  },

  getOrAddItemRender: function(item, key) {
    return this.getItemRender(item, key) || this.addItemRender(item, key);
  }
});

module.exports = ItemRenderer;
