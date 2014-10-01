var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;;
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

  drawItem: function(options) {
    _.each(options.renders, function(render, key) {
      options.newRender = render;
      options.renderKey = key;
      this.drawItemRender(options);
    }, this);
  },

  drawItemRender: function(options) {
    var renderKey = options.renderKey;
    var newRender = options.newRender;

    var currentRender = item.getRender(renderKey);

    // Re-use the current element, or if that does not exist create a new one
    newRender.element = (currentRender && currentRender.element) || this.itemRenderer.createContainer(options);

    // TODO: this code is temporary - change later
    if (!newRender.element.parentNode) {
      this.frame.appendChild(newRender.element);
    }

    // If the new transform is the same as the current transform, do nothing
    if (currentRender && _.isEqual(currentRender.transform, newRender.transform)) {
      return;
    }

    newRender.animateOptions = this.getAnimateOptions(options);

    // Start the animation
    this.animate(newRender.element, newRender.transform, newRender.animateOptions);
  },

  getAnimateOptions: function(options) {
    var animateOptions = this.itemRenderer.getAnimateOptions(options);
    _.extend({
      duration: 400,
      easing: "easeInOutExpo",
      complete: _.bind(this.onAnimationComplete, this, options),
      progress: _.bind(this.onAnimationProgress, this, options)
    }, animateOptions);
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

