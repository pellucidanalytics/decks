var _ = require("lodash");
var EventEmitter = require("events").EventEmitter;
var util = require("util");

function ItemRenderer(options) {
  if (!(this instanceof ItemRenderer)) { return new ItemRenderer(options); }
  if (!_.isFunction(options.loadItem)) { throw new Error("options.loadItem must be a function"); }
  if (!_.isFunction(options.unloadItem)) { throw new Error("options.unloadItem must be a function"); }

  this.loadItem = options.loadItem;
  this.unloadItem = options.unloadItem;

  if (_.isFunction(options.createDefaultContainer)) {
    this.createDefaultContainer = options.createDefaultContainer;
  }

  if (_.isFunction(options.createDefaultTransform)) {
    this.createDefaultTransform = options.createDefaultTransform;
  }

  if (_.isFunction(options.createDefaultRender)) {
    this.createDefaultRender = options.createDefaultRender;
  }
}

_.extend(ItemRenderer.prototype, {
  /**
   * Creates the default container element for each item
   */
  createContainer: function() {
    var container = document.createElement("div");
    container.className = "decks-item";
    return container;
  },

  /**
   * Creates the default transform to apply to each item
   */
  createDefaultTransform: function() {
    return null;
  },

  /**
   * Creates the default render object for each items
   */
  createDefaultRender: function() {
    return {
      container: this.createContainer(),
      transform: this.createDefaultTransform()
    };
  }
});

module.exports = ItemRenderer;
