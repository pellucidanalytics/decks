var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");

function Canvas(options) {
  if (!(this instanceof Canvas)) { return new Canvas(options); }
  EventEmitter.call(this);
  this.setElement(options.element);
}

inherits(Canvas, EventEmitter);

_.extend(Canvas.prototype, {
  setElement: function(element, options) {
    options = options || {};

    if (!element) {
      element = document.createElement("div");
    }
    element.classList.add("decks-canvas");
    element.style.position = "absolute";

    this.element = element;

    if (!options.silent) {
      this.emit("element:set", element);
    }
  },

  addRender: function(render) {
    if (!render || !render.element || render.isInCanvas) {
      return;
    }
    this.element.appendChild(render.element);
    render.isInCanvas = true;
  },

  removeRender: function(render) {
    if (!render || !render.element || !render.isInCanvas) {
      return;
    }
    this.element.removeChild(render.element);
    render.isInCanvas = false;
  }
});

module.exports = Canvas;
