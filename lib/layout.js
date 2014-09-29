var _ = require("lodash");
var EventEmitter = require("events").EventEmitter;
var util = require("util");

function Layout(options) {
  EventEmitter.call(this);
  this.getItemTransforms = options.getItemTransforms;
}

util.inherits(Layout, EventEmitter);

_.extend(Layout.prototype, {

  render: function(viewport, items) {
    _.each(items, function(item) {
      var itemTransforms = this.getItemTransforms(item);
      viewport.renderItem(item, itemTransforms);
    }, this);
  }
});
