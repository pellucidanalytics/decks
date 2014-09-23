var _ = require("lodash");
var Item = require('./item');

var Collection = function(options) {
  if (!(this instanceof Collection)) { return new Collection(options); }
  this.options = options;
  this.options.items = this.options.items || [];
  this.container = this.options.container || document.createElement('div');
};

_.extend(Collection.prototype, {
  addItem: function (item) {
    var item = new Item(item);
    this.options.items.push(item);
    return item;
  },
  load: function () {
    _.each(this.options.items, function (item) {
      this.container.appendChild(item.load());
    }, this);
    return this.container;
  }
});

module.exports = Collection;
