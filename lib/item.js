var _ = require("lodash");
var EventEmitter = require("events").EventEmitter;
var util = require("util");

function Item(options) {
  if (!(this instanceof Item)) { return new Item(options); }
  EventEmitter.call(this);

  // Creates the HTML representation of the item
  this.toHTML = options.toHTML;

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
  },

  load: function(key) {
    var self = this;

    this.emit("loading");

    this.renders[key].container.innerHTML = this.toHTML(this.renders[key].size);

    // TODO: Is this the only way?
    setTimeout(function() {
      self.emit("loaded");
    }, 1);
  },

  unload: function(key) {
    this.emit("unloading");

    // TODO
    this.renders[key].container.innerHTML = "";
    // set loading state?

    this.emit("unloaded");
  }

});

module.exports = Item;
