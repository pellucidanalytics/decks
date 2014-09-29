var _ = require("lodash");

function ItemRender(options) {
  this.id = options.id; // Making each ItemRender have a unique id makes our lives easier...
  this.container = options.container;
  this.transform = options.transform;
}

_.extend(ItemRender.prototype, {
});

module.exports = ItemRender;
