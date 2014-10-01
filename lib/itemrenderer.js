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

  if (_.isFunction(options.getRenderContainer)) {
    this.getRenderContainer = options.getRenderContainer;
  }

  if (_.isFunction(options.getRenderAnimateOptions)) {
    this.getRenderAnimateOptions = options.getRenderAnimateOptions;
  }
}

inherits(ItemRenderer, EventEmitter);

_.extend(ItemRenderer.prototype, {

  getRenderContainer: function(options) {
    var container = document.createElement("div");
    container.className = "decks-item";
    container.style.position = "absolute";
    return container;
  },

  getRenderAnimateOptions: function(options) {
    return {
      duration: 400,
      easing: "easeInOutExpo"
    };
  }
});

module.exports = ItemRenderer;
