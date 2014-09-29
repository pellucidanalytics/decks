var _ = require("lodash");
var Velocity = require('velocity-animate');
var EventEmitter = require("events").EventEmitter;
var util = require("util");

var Deck = function(options) {
  if (!(this instanceof Deck)) { return new Deck(options); }
  EventEmitter.call(this);
  this.items = [];
  this.addItems(options.items);
  this.setLayout(options.layout);
};

util.inherits(Deck, EventEmitter);

_.extend(Deck.prototype, {

  addItems: function(items) {
    _.each(items, function(item) {
      this.addItem(item);
    }, this);
  },

  addItem: function(item) {
    items.push(new Item(item));
    this.emit("itemAdded");
  },

  removeItem: function(item) {
    // ?
  },

  setLayout: function(layout) {
    this.layout = layout;
  }

});

module.exports = Deck;
