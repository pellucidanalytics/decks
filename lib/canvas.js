var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");

function Canvas(options) {
  if (!(this instanceof Canvas)) { return new Canvas(options); }
  EventEmitter.call(this);
  this.options = options;
  this.setElement(options.element);
}

inherits(Canvas, EventEmitter);

_.extend(Canvas.prototype, {

  setElement: function(element, options) {
    options = options || {};

    if (!element) {
      element = document.createElement("div");
    }

    this.element = this.initializeElement(element);

    if (!options.silent) {
      this.emit("element:set", element);
    }
  },

  initializeElement: function(element) {
    element.classList.add("decks-canvas");
    element.style.position = "absolute";

    if (this.options.width) {
      element.style.width = this.options.width;
    }

    if (this.options.height) {
      element.style.height = this.options.height;
    }

    return element;
  },

  addRender: function(render) {
    if (!render || !render.element || this.isInCanvas(render.element)) {
      return;
    }
    console.log("add to canvas");
    this.element.appendChild(render.element);
    this.isInCanvas(render.element, true);
  },

  removeRender: function(render) {
    if (!render || !render.element || !this.isInCanvas(render.element)) {
      return;
    }
    console.log("remove from canvas");
    this.element.removeChild(render.element);
    this.isInCanvas(render.element, false);
  },

  isInCanvas: function(element, value) {
    var key = "_decks_isInCanvas";
    if (!_.isBoolean(value)) {
      return !!element[key];
    }
    element[key] = value;
  }
});

module.exports = Canvas;
