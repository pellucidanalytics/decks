var _ = require("lodash");
var EventEmitter = require("events").EventEmitter;
var util = require("util");

function Viewport(options) {
  if (!(this instanceof Viewport)) { return new Viewport(options); }
  if (!_.isFunction(options.animate)) { throw new Error("options.animate must be a function (Velocity-like)"); }
  EventEmitter.call(this);
  this.setAnimate(options.animate);
  this.setItemRenderer(options.itemRenderer);
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

    // Start the animation
    this.animate(
      newRender.element,
      newRender.transform,
      this.extendAnimateOptions(newRender.animateOptions, animateCallbackOptions));
  },

  extendAnimateOptions: function(options, animateCallbackOptions) {
    return _.extend({
      duration: 400,
      complete: _.bind(this.onAnimationComplete, this, animateCallbackOptions),
      progress: _.bind(this.onAnimationProgress, this, animateCallbackOptions)
    }, options);
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
  },

  setAnimate: function(animate) {
    this.animate = animate;
  },

  setItemRenderer: function(itemRenderer) {
    this.itemRenderer = itemRenderer;
  }
});

module.exports = Viewport;

