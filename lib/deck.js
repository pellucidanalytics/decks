var _ = require("lodash");

var Deck = function(options) {
  if (!(this instanceof Deck)) { return new Deck(options); }
  this.options = options;
};

_.extend(Deck.prototype, {
});

module.exports = Deck;
