var _ = require("lodash");
var Item = require('./item');

var Collection = function(options) {
  if (!(this instanceof Collection)) { return new Collection(options); }
  this.options = options;
  this.options.items = this.options.items || [];
  this.isExpanded = this.options.expand || false;
  this.container = this.options.container || document.createElement('div');
  this.container.className += ' deck-collection';
};

_.extend(Collection.prototype, {
  addItem: function (item) {
    var item = new Item(item);
    this.options.items.push(item);
    return item;
  },
  load: function () {
    _.each(this.options.items, function (item, index) {
      // if the collection is expanded, load each item, otherwise
      // load the first item but only containers for the other items
      if (this.isExpanded || index === 0)
        this.container.appendChild(item.load());
      else {
        this.container.appendChild(item.container);
      }
    }, this);
    return this.container;
  }
});

module.exports = Collection;
