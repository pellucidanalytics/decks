var _ = require("lodash");

var Item = function(options) {
  if (!(this instanceof Item)) { return new Item(options); }
  this.options = options;
  this.container = this.options.container || document.createElement('div');
  this.container.className += ' deck-item';
};

_.extend(Item.prototype, {

  load: function() {
    this.container.appendChild(this.options.element);
    return this.container;
  },

  unload: function() {
    throw new Error("load is abstract");
  }

});

module.exports = Item;
