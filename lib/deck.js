var _ = require("lodash");
var Collection = require("./collection");

var Deck = function(options) {
  if (!(this instanceof Deck)) { return new Deck(options); }
  this.options = options;
  this.collections = this.options.collections || [];
  this.container = this.options.container || document.createElement('div');
  this.container.className += ' deck';
};

_.extend(Deck.prototype, {
  addCollection: function (collection) {
    var collection = new Collection(collection);
    this.collections.push(collection);
    return collection;
  },
  load: function () {
    // the number of items that fit in each row; at least 1
    var perRow = Math.floor(this.options.width / this.options.itemWidth) || 1;

    // default styles for the container
    this.container.style.position = 'relative';
    this.container.style.height = this.options.height + 'px';
    this.container.style.width = this.options.width + 'px';

    // add each collection to the container
    _.each(this.collections, function (collection, index) {
      var el = collection.load(),
          // the row the element falls in, based on available width
          row = Math.floor(index / perRow),
          col = index % perRow;

      el.style.position = 'absolute';
      el.style.top = row * this.options.itemHeight + 'px';
      el.style.left = col * this.options.itemWidth + 'px';

      this.container.appendChild(el);
    }, this);

    return this.container;
  }
});

module.exports = Deck;
