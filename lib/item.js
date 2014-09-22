var _ = require("lodash");

var Item = function(options) {
  if (!(this instanceof Item)) { return new Item(options); }
  this.options = options;
};

_.extend(Item.prototype, {

  load: function() {
    throw new Error("load is abstract");
  },

  unload: function() {
    throw new Error("load is abstract");
  }

});

module.exports = Item;
