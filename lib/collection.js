var _ = require("lodash");
var Item = require('./item');

var Collection = function(options) {
  if (!(this instanceof Collection)) { return new Collection(options); }
  this.options = options;
  this.options.items = this.options.items || [];
};

_.extend(Collection.prototype, {
  addItem: function (item) {
    this.options.items.push(new Item(item));
  }
});

module.exports = Collection;
