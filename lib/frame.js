var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");
var Canvas = require("./canvas");

function Frame(options) {
  if (!(this instanceof Frame)) { return new Frame(options); }
  EventEmitter.call(this);

  this.setElement(options.element);
  this.setCanvas(options.canvas);
}

inherits(Frame, EventEmitter);

_.extend(Frame.prototype, {

  setElement: function(element, options) {
    if (!element) { throw new Error("element is required"); }
    options = options || {};

    element.classList.add("decks-frame");
    element.style.position = "relative";
    element.style.overflow = "hidden";

    // TODO: make sure frame has width and height (?)

    this.element = element;

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

    // Put canvas element in frame
    if (!this.frame) {
      return;
    }

    this.clear();
    this.addChildElement(canvas.element);
    this.canvas = canvas;

    if (!options.silent) {
      this.emit("canvas:set", canvas);
    }
  },

  clear: function() {
    this.element.innerHTML = "";
  },

  addChildElement: function(element) {
    this.element.appendChild(element);
  },

  isElementVisible: function(element) {
    return true;
  },
});

module.exports = Frame;
