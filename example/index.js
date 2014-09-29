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
  width: 1000,
  height: 600,
  itemWidth: 300,
  itemHeight: 200
  //...
});

_.each(groups, function (group) {
  _.each(group.tags, function (tag) {
    // get an array of all food items matching our tag
    var currentCollection = foodDeck.addCollection({
      // ...
    });

    _.each(getFoodsByTag(foods, tag), function (item) {
      var image = new Image();
      image.src = item.imgUrl;

      currentCollection.addItem({
        name: item.name,
        element: image,
        tags: item.tags
      });
    });
  });
});

var btn = document.createElement('button');
btn.appendChild(document.createTextNode('Expand All'));
btn.onclick = function () {
  foodDeck.expandAll();
};

document.body.appendChild(btn);
document.body.appendChild(foodDeck.load());
