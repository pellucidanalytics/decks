var _ = require("lodash");
var EventEmitter = require("events").EventEmitter;
var util = require("util");

function Item(options) {
  if (!(this instanceof Item)) { return new Item(options); }
  EventEmitter.call(this);

  // Copy all the options to 'this'?  (raw data props)
  _.extend(this, options);
  //_.extend(this, options.data);
  //this.data = options.data;

  this.id = options.id; // Making each item have a unique id makes things easier for us... but maybe not what we want
  this.renders = [];
}

util.inherits(Item, EventEmitter);

_.extend(Item.prototype, {
});

module.exports = Item;
