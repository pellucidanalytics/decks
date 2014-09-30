var _ = require("lodash");
var EventEmitter = require("events").EventEmitter;
var util = require("util");

function Item(data) {
  if (!(this instanceof Item)) { return new Item(data); }
  EventEmitter.call(this);

  // Copy the data properties onto this Item instance
  _.extend(this, data);

  // Keyed collection of renders for this item
  this.renders = {};
}

util.inherits(Item, EventEmitter);

_.extend(Item.prototype, {

  hasRender: function(key) {
    return !!this.getRender(key);
  },

  getRender: function(key) {
    return this.renders[key];
  },

  addRender: function(key, render) {
    this.renders[key] = render;
    this.emit("render:added");
  },

  removeRender: function() {
    delete this.renders[key];
    this.emit("render:removed");
  },

  clearRenders: function() {
    this.renders = {};
    this.emit("renders:cleared");
  },

  getData: function(key) {
    return this[key];
  },

  setData: function(key, value) {
    if (this[key] === value) {
      return;
    }
    this[key] = value;
    this.emit("changed", item, key, value);
  }
});

module.exports = Item;
