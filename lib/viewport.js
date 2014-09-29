var _ = require("lodash");
var EventEmitter = require("events").EventEmitter;
var util = require("util");
var Velocity = require("velocity-animate");

function Viewport(options) {
  EventEmitter.call(this);
}

util.inherits(Viewport, EventEmitter);

_.extend(Viewport.prototype, {

  renderItem: function(item, itemTransforms) {
    var self = this;

    _.each(transforms, function(transform, transformKey) {

      var render = self.itemRenderer.getOrAddItemRender(item, transformKey);

      // If the new transform is the same as the item's current transform, do nothing
      if (_.isEqual(render.transform, transform)) {
        return;
      }

      // TODO: check if the item is going to be in teh viewport at any point during the animation
      // If yes, start loading the item now.
      // Or maybe do this in the onAnimationProgress method?

      Velocity(item.container, transform, self.getAnimationOptions(transform))
        .then(function() {
          render.transform = transform;

          if (self.shouldLoadItem(item)) {
            self.itemRenderer.loadItem(item);
          } else {
            self.itemRenderer.unloadItem(item);
          }
        });
    }, this);
  },

  getAnimationOptions: function(transform) {
    var options = {
      duration: 400, // Set by some mapping (???)
      complete: _.bind(this.onAnimationComplete, this),
      progress: _.bind(this.onAnimationProgress, this)
      // TODO...
    };
    return options;
  },

  isItemVisible: function(){
  },

  onAnimationComplete: function() {
  },

  onAnimationProgress: function() {
  },

  shouldLoadItem: function(item) {
  }
});
