(function () {

// it's gross but easy; this comes from data.js
var groups = window.groups;
var foods = window.foods;

function getFoodsByTag(foods, tag) {
  // some magic to return an array of food objects that match the given tag
}

var stacks = [];

// TODO: switch to lodash here
groups.forEach(function (group) {
  group.tags.forEach(function (tag) {
    // get an array of all food items matching our tag
    var matchingItems = getFoodsByTag(foods, tag);

    // we'll probably also want to includes some tag information
    stacks.push(matchingItems);
  });
});

// now that we have a collection of lots of stacks, create a deck

var deck = new Deck({
  items: stacks
});


})();
