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

  if (_.isFunction(options.createDefaultContainer)) {
    this.createDefaultContainer = options.createDefaultContainer;
  }

  if (_.isFunction(options.createDefaultTransform)) {
    this.createDefaultTransform = options.createDefaultTransform;
  }

  if (_.isFunction(options.createDefaultRender)) {
    this.createDefaultRender = options.createDefaultRender;
  }
}

_.extend(ItemRenderer.prototype, {

  /**
   * Creates the default container element for each item
   */
  createDefaultContainer: function() {
    var container = document.createElement("div");
    container.className = "decks-item";
    return container;
  },

  /**
   * Creates the default transform to apply to each item
   */
  createDefaultTransform: function() {
    return null;
  },

  /**
   * Creates the default render object for each items
   */
  createDefaultRender: function() {
    return {
      container: this.createDefaultContainer(),
      transform: this.createDefaultTransform()
    };
  },

  getItemRender: function(item, key) {
    return item.getRender(key);
  },

  addItemRender: function(item, key, render) {
    render = render || this.createDefaultRender();
    item.addRender(key, render);
    return item.getRender(key);
  },

  getOrAddItemRender: function(item, key) {
    return this.getItemRender(item, key) || this.addItemRender(item, key);
  }
});

module.exports = ItemRenderer;
