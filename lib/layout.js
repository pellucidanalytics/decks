var _ = require("lodash");
var EventEmitter = require("eventemitter2");
var inherits = require("inherits");

function Layout(options) {
  if (!(this instanceof Layout)) { return new Layout(options); }
  if (!_.isFunction(options.getRenders)) { throw new Error("options.getRenders must be a function"); }
  EventEmitter.call(this);
  this.getRenders = options.getRenders;
}

inherits(Layout, EventEmitter);

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
    if (!this.itemCollection) {
      return;
    }
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
    this.itemCollection.off("item:added", this.boundOnCollectionChanged);
    this.itemCollection.off("item:removed", this.boundOnCollectionChanged);
    this.itemCollection.off("item:changed", this.boundOnCollectionChanged);
    this.itemCollection.off("cleared", this.boundOnCollectionChanged);
  },

  onCollectionChanged: function() {
    this.draw();
  },

  draw: function() {
    _.each(this.itemCollection.getItems(), function(item) {
      var renders = this.getRenders(item, this.viewport);
      this.viewport.drawItem(item, renders);
    }, this);
  }
});

module.exports = Layout;
