var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");

function Layout(options) {
  if (!(this instanceof Layout)) { return new Layout(options); }
  EventEmitter.call(this);

  _.bindAll(this, ["onItemAdded", "onItemRemoved", "onItemChanged", "onCleared"]);

  this.createRenders = options.createRenders;
  this.createRenderElement = options.createRenderElement;
  this.loadRenderElement = options.loadRenderElement;
  this.unloadRenderElement = options.unloadRenderElement;
}

inherits(Layout, EventEmitter);

_.extend(Layout.prototype, {

  init: function() {
    var renders = _(this.itemCollection.getItems())
      .map(function(item, index, items) {
        return this.getRenders(item, index, items);
      }, this)
      .flatten()
      .value();

    viewport.setRenders(renders);
  },

  createRenderElement: function(item, index, items) {
    var element = document.createElement("div");
    element.id = "decks-item-" + index;
    element.style.position = "absolute";
    return element;
  },

  setViewport: function(viewport) {
    this.unbindViewportEvents();
    this.viewport = viewport;
    this.bindViewportEvents();
  },

  setItemCollection: function(itemCollection) {
    this.unbindItemCollectionEvents();
    this.itemCollection = itemCollection;
    this.bindItemCollectionEvents();
  },

  bindViewportEvents: function() {
  },

  unbindViewportEvents: function() {
  },

  bindItemCollectionEvents: function() {
    if (!this.itemCollection) {
      return;
    }
    this.itemCollection.on("item:added", this.onItemAdded);
    this.itemCollection.on("item:removed", this.onItemRemoved);
    this.itemCollection.on("item:changed", this.onItemChanged);
    this.itemCollection.on("cleared", this.onCleared);
  },

  unbindItemCollectionEvents: function() {
    if (!this.itemCollection) {
      return;
    }
    this.itemCollection.off("item:added", this.onItemAdded);
    this.itemCollection.off("item:removed", this.onItemRemoved);
    this.itemCollection.off("item:changed", this.onItemChanged);
    this.itemCollection.off("cleared", this.onCleared);
  },

  onItemAdded: function(item) {
  },

  onItemRemoved: function(item) {
  },

  onItemChanged: function(item) {
  },

  onCleared: function(item) {
  }
});

module.exports = Layout;
