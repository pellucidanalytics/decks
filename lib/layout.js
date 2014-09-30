var _ = require("lodash");
var EventEmitter = require("events").EventEmitter;
var util = require("util");

function Layout(options) {
  if (!(this instanceof Layout)) { return new Layout(options); }
  if (!_.isFunction(options.getRenders)) { throw new Error("options.getRenders must be a function"); }
  EventEmitter.call(this);
  this.getRenders = options.getRenders;
}

util.inherits(Layout, EventEmitter);

_.extend(Layout.prototype, {

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
    this.boundOnCollectionChanged = _.bind(this.onCollectionChanged, this);
    this.itemCollection.on("item:added", this.boundOnCollectionChanged);
    this.itemCollection.on("item:removed", this.boundOnCollectionChanged);
    this.itemCollection.on("item:changed", this.boundOnCollectionChanged);
    this.itemCollection.on("cleared", this.boundOnCollectionChanged);
  },

  unbindItemCollectionEvents: function() {
    if (!this.itemCollection || !this.boundOnCollectionChanged) {
      return;
    }
    this.itemCollection.removeListener("item:added", this.boundOnCollectionChanged);
    this.itemCollection.removeListener("item:removed", this.boundOnCollectionChanged);
    this.itemCollection.removeListener("item:changed", this.boundOnCollectionChanged);
    this.itemCollection.removeListener("cleared", this.boundOnCollectionChanged);
  },

  onCollectionChanged: function() {
    this.draw();
  },

  draw: function() {
    _.each(this.itemCollection.getItems(), function(item) {
      var renders = this.getRenders(item);
      viewport.drawItem(item, renders);
    }, this);
  }
});

module.exports = Layout;
