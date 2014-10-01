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
    var item = options.item;

    var currentRender = item.getRender(renderKey) || item.getRender();

    // Re-use the current element, or if that does not exist create a new one
    newRender.element = (currentRender && currentRender.element) || this.itemRenderer.createRenderElement(options);

    // TODO: this code is temporary - change later
    if (!newRender.element.parentNode) {
      this.frame.appendChild(newRender.element);
    }

    // If the new transform is the same as the current transform, do nothing
    if (currentRender && _.isEqual(currentRender.transform, newRender.transform)) {
      return;
    }

    // Start the animation
    this.animate(newRender.element, newRender.transform, this.getAnimateOptions(options));
  },

  getAnimateOptions: function(options) {
    var defaultOptions = {
      complete: _.bind(this.onAnimationComplete, this, options),
      progress: _.bind(this.onAnimationProgress, this, options)
    };
    var globalOptions = this.itemRenderer.createRenderAnimateOptions(options);
    var individualOptions = options.newRender.animateOptions;
    return _.extend(defaultOptions, globalOptions, individualOptions);
  },

  isElementInFrame: function(element) {
    // TODO - check if item.element is visible in the viewport "frame"
    return true;
  },

  onAnimationComplete: function(options) {
    options.item.setRender(options.key, options.newRender);
  },

  onAnimationProgress: function(options) {
    if (this.isElementInFrame(options.newRender.element)) {
      this.itemRenderer.loadRender(options);
    } else {
      this.itemRenderer.unloadRender(options);
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

