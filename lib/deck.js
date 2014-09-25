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
  /**
   * Given the width of a container, the width of an item, and the gutter between inner items,
   * calculate the number of items that can fit on a single row inside the container.
   * @param  {number} deckWidth   the width, in pixels, of the container
   * @param  {number} itemWidth   the width of each individual item in the container
   * @param  {number} [gutter]    the space, in pixels, between each item
   * @return {number}             the number of items that fit in a row without overflow, never less than 1
   */
  _calculateItemsPerRow: function (deckWidth, itemWidth, gutter) {
    // first, assume no gutter
    var itemsPerRow = Math.floor(deckWidth / itemWidth) || 1;

    // if we have a gutter, can we still fit that many items in a row?
    if (gutter) {
      while (itemsPerRow) {
        if ((itemWidth * itemsPerRow) + (gutter * (itemsPerRow - 1)) <= deckWidth) {
          return itemsPerRow;
        }
        itemsPerRow--;
      }
    }
    return itemsPerRow || 1; // we will never have less than 1 item in a row
  },
  addCollection: function (collection) {
    var collection = new Collection(collection);
    this.collections.push(collection);
    return collection;
  },
  load: function () {
    // freak out if important properties are missing (or 0)
    if (!this.options.itemWidth) throw new Error('Item width is required and must not be 0.');

    // the number of items that fit in each row
    var perRow = this._calculateItemsPerRow(this.options.width, this.options.itemWidth, this.options.gutter);

    // if no gutter is defined, create it automatically based on the leftover space
    if (_.isUndefined(this.options.gutter)) {
      this.options.gutter = (this.options.width % this.options.itemWidth) / (perRow - 1);
    }

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

      el.style.top = row * (this.options.itemHeight + this.options.gutter) + 'px';
      el.style.left = col * (this.options.itemWidth + this.options.gutter) + 'px';

      this.container.appendChild(el);
    }, this);

    return this.container;
  },
  expandAll: function () {
    _.each(this.collections, function (item, index) {
      // position each collection so that it appears at the beginning of a row
      item.container.style.left = 0 + 'px';
      item.container.style.top = index * (this.options.itemHeight + this.options.gutter) + 'px';

      // and call its expand method
      item.expand(this.options.itemWidth, this.options.gutter);
    }, this);
  },
  stackAll: function () {
    // switch each collection to stacks
  }
});

module.exports = Deck;
