function Item(options) {
  this.isLoaded = false;

  this.renders = {};
}

Item.prototype = {
  load: function() {
  }
};



function ViewPort(options) {
  this.canvas = {};
  this.frame = {};
}

ViewPort.prototype = {
};



function Layout(options) {
  this.getItemTransform = options.getItemTransform;
}

Layout.prototype = {
};



function Deck(options) {
  this.items = [];
}

Deck.prototype = {
  createItem: function(options){ 
  },

  addItem: function(options) {
    var item = this.createItem(options);
    items.push(item);
  },

  addItems: function(items) {
  },

  setLayout: function(layout) {
  }
};
