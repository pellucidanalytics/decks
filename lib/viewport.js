var _ = require("lodash");
var EventEmitter = require("eventemitter2");
var inherits = require("inherits");

function Viewport(options) {
  if (!(this instanceof Viewport)) { return new Viewport(options); }
  if (!_.isFunction(options.animate)) { throw new Error("options.animate must be a function (Velocity-like)"); }
  if (!options.frame) { throw new Error("options.frame must be a reference to a container in the DOM"); }
  EventEmitter.call(this);

  this.frame = options.frame;
  this.setAnimate(options.animate);
  this.setItemRenderer(options.itemRenderer);
}

inherits(Viewport, EventEmitter);

_.extend(Viewport.prototype, {

  drawItem: function(item, renders) {
    _.each(renders, function(render, key) {
      this.drawItemRender(item, render, key);
    }, this);
  },

  drawItemRender: function(item, newRender, key) {
    var currentRender = item.getRender(key);

    // if no element is passed, use the existing element or create one
    if (!newRender.element) {
      newRender.element = (currentRender && currentRender.element) || this.itemRenderer.createContainer();
    }

    if (!newRender.element.parentNode) {
      this.frame.appendChild(newRender.element);
    }

    if (currentRender && _.isEqual(currentRender.transform, newRender.transform)) {
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

  onAnimationComplete: function(options) {
    options.item.setRender(options.key, options.newRender);
  },

  onAnimationProgress: function(options) {
    if (this.isItemVisible(options.newRender.element)) {
      this.itemRenderer.loadItem(options);
    } else {
      this.itemRenderer.unloadItem(options);
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

