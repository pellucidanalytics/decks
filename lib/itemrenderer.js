var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");

function ItemRenderer(options) {
  if (!(this instanceof ItemRenderer)) { return new ItemRenderer(options); }
  if (!_.isFunction(options.loadItem)) { throw new Error("options.loadItem must be a function"); }
  if (!_.isFunction(options.unloadItem)) { throw new Error("options.unloadItem must be a function"); }
  EventEmitter.call(this);

  this.loadItem = options.loadItem;
  this.unloadItem = options.unloadItem;

  if (_.isFunction(options.createContainer)) {
    this.createContainer = options.createContainer;
  }

  if (_.isFunction(options.createAnimateOptions)) {
    this.createAnimateOptions = options.createAnimateOptions;
  }
}

inherits(ItemRenderer, EventEmitter);

_.extend(ItemRenderer.prototype, {
  /**
   * Creates the default container element for each item
   */
  createContainer: function() {
    var container = document.createElement("div");
    container.className = "decks-item";
    container.style.position = "absolute";
    return container;
  },

  createAnimateOptions: function() {
    return {
      duration: 400,
      easing: "easeInOutExpo"
    };
  }
});

module.exports = ItemRenderer;
