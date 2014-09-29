var _ = require("lodash");
var EventEmitter = require("events").EventEmitter;
var util = require("util");

function Deck(options) {
  if (!(this instanceof Deck)) { return new Deck(options); }
  EventEmitter.call(this);

  this.items = [];
  this.itemRenderer = options.itemRenderer;

  this.setViewport(options.viewport);
  this.setLayout(options.layout);
  this.addItems(options.items);
}

util.inherits(Deck, EventEmitter);

_.extend(Deck.prototype, {

  addItems: function(items) {
    _.each(items, function(item) {
      this.addItem(item, true);
    }, this);

    this.layout.render();
  },

  addItem: function(item, noRender) {
    items.push(new Item(item));
    !noRender && this.layout.render();

    this.emit("item:added", item);
  },

  removeItem: function(item) {
  },

  setViewport: function(viewport) {
    this.viewport = viewport;
    // re-render layout if it exists?
  },

  setLayout: function(layout) {
    this.layout = layout;
    this.layout.render(this.viewport, this.items);
  }

});

module.exports = Deck;

