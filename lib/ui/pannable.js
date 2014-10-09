var _ = require("lodash");
//var services = require("../services");
var binder = require("../events").binder;
var Hammer = require("../../vendor").Hammer;
var dom = require("./dom");

function Pannable(options) {
  if (!(this instanceof Pannable)) { return new Pannable(options); }
  options = options || {};

  this.isHorizontal = _.isBoolean(options.isHorizontal) ? options.isHorizontal : true;
  this.isVertical = _.isBoolean(options.isVertical) ? options.isHorizontal : true;

  this.setElement(options.element);
  this.setBounds(options.bounds);
}

Pannable.hammerEvents = {
  "panstart": "onPanStart",
  "panend": "onPanEnd",
  "panmove": "onPanMove",
  //"panleft": "_onPanHorizontal",
  //"panRight": "_onPanHorizontal",
  //"panup": "_onPanVertical",
  //"pandown": "_onPanVertical",
  "pancancel": "onPanCancel"
};

_.extend(Pannable.prototype, binder, {
  setElement: function(element) {
    if (!element) { throw new Error("element is required"); }

    this.element = element;
    this.hammer = Hammer(element);

    this.bindEvents(this.hammer, Pannable.hammerEvents);
  },

  setBounds: function(bounds) {
    if (!bounds) { throw new Error("bounds is required"); }
    this.bounds = bounds;
  },

  onPanStart: function(e) {
    console.log("panstart", e);
    this.start = {
      event: e,
      top: dom.getStyle(this.element, "top", { parseInt: true }),
      left: dom.getStyle(this.element, "left", { parseInt: true }),
    };
  },

  onPanEnd: function(e) {
    console.log("panend", e);
  },

  onPanMove: function(e) {
    if (this.isVertical) {
      var newTop = this.start.top + e.deltaY;

      if (newTop > this.bounds.top) {
        newTop = this.bounds.top;
      }

      dom.setStyle(this.element, "top", this.start.top + e.deltaY);
    }

    if (this.isHorizontal) {
      dom.setStyle(this.element, "left", this.start.left + e.deltaX);
    }
  },

  onPanCancel: function(e) {
    console.log("pancancel", e);
  }
});

module.exports = Pannable;
