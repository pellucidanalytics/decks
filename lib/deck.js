var _ = require("lodash");
var Collection = require("./collection");

var Deck = function(options) {
  if (!(this instanceof Deck)) { return new Deck(options); }
  this.options = options;
  this.collections = this.options.collections || [];
  this.container = this.options.container || document.createElement('div');
};

_.extend(Deck.prototype, {
  addCollection: function (collection) {
    var collection = new Collection(collection);
    this.collections.push(collection);
    return collection;
  },
  load: function () {
    _.each(this.collections, function (collection) {
      this.container.appendChild(collection.load());
    }, this);

    return this.container;
  }
});

module.exports = Deck;
