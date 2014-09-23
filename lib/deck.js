var _ = require("lodash");
var Collection = require("./collection");

var Deck = function(options) {
  if (!(this instanceof Deck)) { return new Deck(options); }
  this.options = options;
  this.options.collections = this.options.collections || [];
};

_.extend(Deck.prototype, {
  addCollection: function (collection) {
    this.options.collections.push(new Collection(collection));
  }
});

module.exports = Deck;
