var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");

function Canvas(options) {
  if (!(this instanceof Canvas)) { return new Canvas(options); }
  EventEmitter.call(this);
  this.width = options.width || Canvas.Size.MatchFrame;
  this.height = options.height || Canvas.Size.Fluid;
  this.setElement(options.element);
}

inherits(Canvas, EventEmitter);

Canvas.Size = {
  MatchFrame: "MatchFrame",
  Fluid: "Fluid"
};

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

    if (this.width === Canvas.Size.MatchFrame) {
      // set width to match frame
    } else if (_.isNumber(this.width)) {
      element.style.width = this.width + "px";
    } else if (this.width) {
      element.style.width = this.width;
    }

    if (_.isNumber(this.height)) {
      element.style.height = this.height + "px";
    }

    return element;
  },

  addRender: function(render) {
    if (!render || !render.element || render.isInCanvas) {
      return;
    }
    console.log("add to canvas");
    this.element.appendChild(render.element);
    render.isInCanvas = true;
  },

  removeRender: function(render) {
    if (!render || !render.element || !render.isInCanvas) {
      return;
    }
    console.log("remove from canvas");
    this.element.removeChild(render.element);
    render.isInCanvas = false;
  }
});

module.exports = Canvas;
