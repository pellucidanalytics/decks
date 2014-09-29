var _ = require("lodash");
var EventEmitter = require("events").EventEmitter;
var util = require("util");

function Item(options) {
  if (!(this instanceof Item)) { return new Item(options); }
  EventEmitter.call(this);

  if (options.createRender) {
    this.createRender = options.createRender;
  }

  // Collection of render configuration items
  this.renders = {};
}

util.inherits(Item, EventEmitter);

_.extend(Item.prototype, {

  createRender: function() {
    return {
      container: document.createElement("div"), // give this a class/id/data attrs?
      transform: null,
      size: {
        width: 0,
        height: 0
      }
    };
  },

  getRender: function(key) {
    if (!this.renders[key]) {
      this.renders[key] = this.createRender();
    }
    return this.renders[key];
  }
});

module.exports = Item;
