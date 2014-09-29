var _ = require("lodash");
var EventEmitter = require("events").EventEmitter;
var util = require("util");
var Velocity = require("velocity-animate");

function Viewport(options) {
  EventEmitter.call(this);
  this.animationMap = _.extend({}, this.defaultAnimationMap, options.animationMap);
}

util.inherits(Viewport, EventEmitter);

_.extend(Viewport.prototype, {

  drawItem: function(item, transforms) {
    var self = this;

    _.each(transforms, function(transform, key) {

      var render = item.getRender(key);

      if (_.isEqual(render.transform, transform)) {
        return;
      }

      // TODO: calculate end position after transformation
      // to determine if item will be within viewport after animating
      // ... and conditionally start loading the item now

      Velocity(item.container, transform, self.getAnimationOptions(transform))
        .then(function() {
          render.transform = transform;

          // decide if item needs to be loaded
          if (!self.shouldLoadItem(item)) {
            return;
          }

          item.load(key);

        });

    }, this);
  },

  shouldLoadItem: function(item) {
    // given an item and i
  },

  getAnimationOptions: function(transform) {
    // ?
    if (transform.translateX) {
      return {
        duration: 400
      };
    }
  }

});
