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

      /*
      var exampleItemTransforms = {
        "stack1": {
          translateX: 10,
          translateY: 10,
          zIndex: 1,
          width: 300,
          height: 200
        },
        "stack2": {
          translateX: 310,
          translateY: 10,
          zIndex: 2,
          width: 300,
          height: 200
        }
      };
      */

      var transforms = this.getItemTransforms(item);
      viewport.drawItem(item, transforms);
    }, this);
  }
});
