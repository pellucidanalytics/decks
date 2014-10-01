var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");

function ItemRenderer(options) {
  if (!(this instanceof ItemRenderer)) { return new ItemRenderer(options); }
  if (!_.isFunction(options.loadRender)) { throw new Error("options.loadRender must be a function"); }
  if (!_.isFunction(options.unloadRender)) { throw new Error("options.unloadRender must be a function"); }
  EventEmitter.call(this);

  this.loadRender = options.loadRender;
  this.unloadRender = options.unloadRender;

  if (_.isFunction(options.createRenderElement)) {
    this.createRenderElement = options.createRenderElement;
  }

  if (_.isFunction(options.createRenderAnimateOptions)) {
    this.createRenderAnimateOptions = options.createRenderAnimateOptions;
  }
}

inherits(ItemRenderer, EventEmitter);

_.extend(ItemRenderer.prototype, {

  createRenderElement: function(options) {
    var container = document.createElement("div");
    container.className = "decks-item";
    container.style.position = "absolute";
    return container;
  },

  createRenderAnimateOptions: function(options) {
    return {
      duration: 400,
      easing: "easeInOutExpo"
    };
  }
});

module.exports = ItemRenderer;
