var _ = require('lodash');
var Deck = require('../lib').Deck;

// pull in our example data
var groups = require('./data').groups;
var foods = require('./data').foods;

function getFoodsByTag(foods, tag) {
  // some magic to return an array of food objects that match the given tag
  return _.filter(foods, function (food) {
    return _.contains(food.tags, tag);
  });
}

var foodDeck = new Deck({
  //...
});

_.each(groups, function (group) {
  _.each(groups.tags, function (tag) {
    // get an array of all food items matching our tag
    var currentCollection = foodDeck.addCollection({
      // ...
    });

    _.each(getFoodsByTag(foods, tag), function (item) {
      currentCollection.addItem({
        // ,,,
      });
    });
  });
});
