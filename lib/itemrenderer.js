var _ = require("lodash");
var EventEmitter = require("events").EventEmitter;
var util = require("util");
var ItemRender = require("./itemrender");

function ItemRenderer(options) {
  if (!(this instanceof ItemRenderer)) { return new ItemRenderer(options); }
  this.loadItem = options.loadItem;
  this.unloadItem = options.unloadItem;
}

_.extend(ItemRenderer.prototype, {

  /**
   * Gets an item render by id
   */
  getItemRender: function(item, itemRenderId) {
    return _.find(item.renders, { id: id });
  },

  /**
   * Creates an item render and adds it to the item
   */
  addItemRender: function(item, itemRenderId) {
    var itemRender = new ItemRender({
      id: itemRenderId,
      container: document.createElement("div"),
      transform: transform || null
    });
    item.renders.push(itemRender);
    return itemRender;
  },

  /**
   * Gets or adds a new item render to the item
   */
  getOrAddItemRender: function(item, itemRenderId) {
    return this.getItemRender(item, itemRenderId) || this.addItemRender(item, itemRenderId);
  }
});

module.exports = ItemRenderer;
