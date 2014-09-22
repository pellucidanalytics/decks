# Decks Requirements

1. Render collection of items in a stack

1. Render collection of items in a small (thumbnail size) swipable
   horizontal (or vertical?) inline list

1. Render collection of items in a larger swipable horizontal (or
   vertical?) overlay list

1. Render a grid of stacked collections

1. Render a vertical list of horizontal collections of items

1. Change layout mode from grid of stacks to list of lists


# Dependencies

- Q
- lodash
- EventEmitter (node/browserify)
- Hammer.js (???)
- Velocity.js (???)



# Notes

class Item {
  label: "",
  tags: [ "tag1", "tag2", ... ],
  isLoaded: false,
  isVisible: true,

  load: function() {
    throw new Error(); // abstract
  },

  unload: function() {
    throw new Error(); // abstract
  },

  applyFilter: function(filter) {
    if (_.isFunction(filter)) { }
    else if (_.isString(filter)) {
      this.isVisible = _.contains(this.tags, filter);
    }
  }
}

class ImageItem extends Item {
  imageURLFormat: ""
}

class ExhibitImageItem extends ImageItem {
  imageURLFormat: "http://.../image.png",
  renderWidth: Number,
  renderHeight: Number,
  pxWidth: Number,
  pxHeight: Number
}

class Collection {
  label: "",
  items: [ item1, item2, etc. ],
  defaultItem: item1 || this.items[0],
  isExpanded: true|false,
  width,
  height,

  load: function(range?) {
    _.each(this.items, function(item) {
      item.load();
    });
  },

  unload: function(range?) {
    _.each(this.items, function(item) {
      item.unload();
    });
  },

  isInView: property
  contextMenu?

  dragAndDrop?

  expand: function() {
    if (desktop) {
      this.expandToGrid(); // helper?
    } else {
      this.expandToRow(); // helper?
    }
  },

  collapse: function() {
    // same as expand
  },

  applyFilter: function(filter) {
  }
}


class Deck {
  container: {element}
  label: "",
  collections: [ collection1, collection2, etc. ]
  width,
  height,

  applyFilter: function(filter) {
    _.each(this.collections, function(collection) {
      collection.applyFilter(filter);
    });
  }
  unapplyFilter: function(filter) {}
  clearFilters: function() {}

  load: function() {
    // load collections
  },

  unload: function() {
    // unload collections
  }

  expand: function() {
    _.each(function(this.collections, function(collection) {
      collection.expand();
    });
  },

  collapse: function() {
    _.each(function(this.collections, function(collection) {
      collection.collapse();
    });
  }
}




// A library is some configuration of tag groups, tags, charts, etc.
var library = organization.getLibrary();

// Each tag group represents a "stack" of charts
var tagGroups = library.getTagGroups();
var collections = [];

_.each(tagGroups, function(tagGroup) {

  // Each tag group contains one or more tags
  var tags = tagGroup.tags;

  _.each(tags, function(tag) {

    // Each chart has one or more tags
    var charts = library.getChartsForTag(tag);
    var items = [];

    _.each(charts, function(chart) {
      items.push(new ExhibitImageItem({
        label: chart.name,
        imageURLFormat: chart.imageURLFormat
      });
    });

    collections.push(new Collection({
      label: tag.name,
      items: items
    });
  });
});


var deck = new Deck({
  collections: collections,
  container: {some element}
});



deck.on("expanded", function() {
});


deck.expand();
deck.collapse();
deck.applyFilter("Assets");



A "Library" represents a grouping of tag groups, tags, and charts for an organization/department/set of users
A "library" contains one or more Tag Groups
Tag Group contains one or more unique Tags
Each pile represents one tag
Each chart has one or more tags

