var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");
var Canvas = require("./canvas");

function Frame(options) {
  if (!(this instanceof Frame)) { return new Frame(options); }
  EventEmitter.call(this);

  this.options = options;
  this.setElement(options.element);
  this.setCanvas(options.canvas);
}

inherits(Frame, EventEmitter);

_.extend(Frame.prototype, {

  setElement: function(element, options) {
    if (!element) { throw new Error("element is required"); }
    options = options || {};

    this.element = this.initializeElement(element);

    if (!options.silent) {
      this.emit("element:set", element);
    }
  },

  setCanvas: function(canvas, options) {
    options = options || {};
    canvas = canvas || {};

    if (!(canvas instanceof Canvas)) {
      canvas = new Canvas(canvas);
    }

    this.canvas = canvas;
    this.element.innerHTML = "";
    this.element.appendChild(this.canvas.element);

    if (!options.silent) {
      this.emit("canvas:set", canvas);
    }
  },

  initializeElement: function(element) {
    element.classList.add("decks-frame");
    element.style.position = "relative";
    element.style.overflow = "hidden";

    if (this.options.width) {
      element.style.width = options.size.width;
    }

    if (this.options.height) {
      element.style.height = options.size.height;
    }

    return element;
  },

  isElementVisible: function(element) {
    return true;
  },
});

module.exports = Frame;
