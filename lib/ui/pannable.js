var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");
var eventBinder = require("../util").eventBinder;
var Hammer = require("../../vendor").Hammer;
//var animator = require("./ui").animator;
var css = require("./css");

function Pannable(options) {
  if (!(this instanceof Pannable)) { return new Pannable(options); }
  options = options || {};
  EventEmitter.call(this);

  this.isHorizontal = _.isBoolean(options.isHorizontal) ? options.isHorizontal : true;
  this.isVertical = _.isBoolean(options.isVertical) ? options.isHorizontal : true;

  this.setElement(options.element);
  this.setBounds(options.bounds);
}

inherits(Pannable, EventEmitter);

_.extend(Pannable.prototype, eventBinder, {
  setElement: function(element) {
    if (!element) { throw new Error("element is required"); }
    if (this.element === element) { return; }

    if (this.element && this.hammer) {
      this.unbindEvents(this.hammer, this._hammerEvents);
    }

    this.element = element;
    this.hammer = Hammer(element);

    this.bindEvents(this.hammer, this._hammerEvents);
  },

  setBounds: function(bounds) {
    if (!bounds) { throw new Error("bounds is required"); }

    this.bounds = bounds;
  },

  setAnimator: function(animator) {
    if (!this.animator) { throw new Error("animator is required"); }
    this.animator = animator;
  },

  _hammerEvents: {
    "panstart": "_onPanStart",
    "panend": "_onPanEnd",
    "panmove": "_onPanMove",
    //"panleft": "_onPanHorizontal",
    //"panRight": "_onPanHorizontal",
    //"panup": "_onPanVertical",
    //"pandown": "_onPanVertical",
    "pancancel": "_onPanCancel"
  },

  _onPanStart: function(e) {
    console.log("panstart", e);
    this.start = {
      event: e,
      top: css.get(this.element, "top", { parseInt: true }),
      left: css.get(this.element, "left", { parseInt: true }),
    };
  },

  _onPanEnd: function(e) {
    console.log("panend", e);
  },

  _onPanMove: function(e) {
    if (this.isVertical) {
      var newTop = this.start.top + e.deltaY;

      if (newTop > this.bounds.top) {
        newTop = this.bounds.top;
      }

      css.set(this.element, "top", this.start.top + e.deltaY);
    }

    if (this.isHorizontal) {
      css.set(this.element, "left", this.start.left + e.deltaX);
    }
  },

  _onPanCancel: function(e) {
    console.log("pancancel", e);
  }
});

module.exports = Pannable;
