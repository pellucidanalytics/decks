var _ = require("lodash");
var EventEmitter = require("events").EventEmitter;
var util = require("util");

function Viewport(options) {
  if (!(this instanceof Viewport)) { return new Viewport(options); }
  if (!_.isFunction(options.animate)) { throw new Error("options.animate must be a function (Velocity-like)"); }
  EventEmitter.call(this);
  this.animate = options.animate;
}

util.inherits(Viewport, EventEmitter);

_.extend(Viewport.prototype, {

  drawItem: function(item, renders) {
    _.each(renders, function(render, key) {
      this.drawItemRender(item, render, key);
    }, this);
  },

  drawItemRender: function(item, newRender, key) {
    var currentRender = item.getRender(key);

    if (currentRender && _.isEqual(currentRender, newRender)) {
      return;
    }

    var animateCallbackOptions = {
      item: item,
      currentRender: currentRender,
      newRender: newRender,
      key: key
    };

    this.animate(newRender.element, newRender.transform, this.getAnimationOptions(newRender.animationOptions, animateCallbackOptions));
  },

  getAnimationOptions: function(animationOptions, callbackOptions) {
    return _.extend({
      duration: 400,
      complete: _.bind(this.onAnimationComplete, this, animateCallbackOptions),
      progress: _.bind(this.onAnimationProgress, this, animateCallbackOptions)
    }, animationOptions);
  },

  isItemVisible: function(item) {
    // TODO - check if item.element is visible in the viewport "frame"
    return true;
  },

  onAnimationComplete: function(item, render, key) {
    item.setRender(key, render);
  },

  onAnimationProgress: function(item) {
    if (this.isItemVisible(item.element)) {
      this.itemRenderer.loadItem(item);
    } else {
      this.itemRenderer.unloadItem(item);
    }
  }
});
