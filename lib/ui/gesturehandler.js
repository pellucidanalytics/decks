var _ = require("lodash");
var Hammer = require("../../vendor/hammer");
var services = require("../services");
var binder = require("../events").binder;
var dom = require("./dom");
var rect = require("../utils").rect;
var DecksEvent = require("../events").DecksEvent;
var PanEmitter = require("./panemitter");
var SwipeEmitter = require("./swipeemitter");
var MouseWheelEmitter = require("./mousewheelemitter");

function GestureHandler(element, options) {
  this._gestureEmitters = {};
  this.setElement(element);
  this.setOptions(options);
  this.bindEvents(services.emitter, GestureHandler.emitterEvents);
}

GestureHandler.emitterEvents = {
  "gesture:**": "onGesture",
  "gesture:pan:start": "onGesturePanStart",
  "gesture:pan:any": "onGesturePanAny",
  "gesture:pan:x": "onGesturePanX",
  "gesture:pan:y": "onGesturePanY",
  "gesture:pan:end": "onGesturePanEnd",
  "gesture:pan:cancel": "onGesturePanCancel",
  "gesture:swipe:any": "onGestureSwipeAny",
  "gesture:swipe:x": "onGestureSwipeX",
  "gesture:swipe:y": "onGestureSwipeY"
};

_.extend(GestureHandler.prototype, binder, /** @lends GestureHandler.prototype */ {

  /**
   * Mapping of gesture names to gesture emitter component constructor functions
   */
  gestureEmitters: {
    pan: PanEmitter,
    swipe: SwipeEmitter,
    mouseWheel: MouseWheelEmitter
  },

  /**
   * Default options to use with a GestureHandler instance.
   */
  defaultOptions: {
    gestures: {
      mouseWheel: {
        enabled: true,
        horizontal: true,
        vertical: true
      },
      pan: {
        enabled: true,
        horizontal: true,
        vertical: true
      },
      swipe: {
        enabled: true,
        horizontal: true,
        vertical: true
      }
    },
    bounds: null,
    snapping: {
      distanceThreshold: 40, // The pixel distance when pulling away from an edge, where movement resistance begins to be applied
      distanceScale: 0.5, // The scale factor for reducing movement when pulling away from an edge
      animateOptions: {
        duration: 400,
        easing: [500, 20] // tension (default 500), friction (default 20)
      }
    },
    inertia: {
      distanceScale: 100, // used to calculate the movement distance for an inertia-based movement (swipe gesture)
      durationScale: 50, // used to calculate the movement duration for an inertia-based movement (swipe gesture)
      animateOptions: {
        easing: "easeOutExpo"
      }
    }
  },

  setElement: function(element) {
    if (!element) { throw new Error("element is required"); }
    this.element = element;
    this.hammer = new Hammer(this.element);
  },

  setOptions: function(options) {
    if (!options) { throw new Error("options is required"); }
    options = _.merge({}, this.defaultOptions, options);

    this.setBounds(options.bounds || null);
    this.snapping = options.snapping;
    this.inertia = options.inertia;

    // Create and init each GestureEmitter instance
    _.each(options.gestures, function(gestureOptions, key) {
      if (!gestureOptions.enabled) {
        return;
      }
      var GestureEmitter = this.gestureEmitters[key];
      if (!GestureEmitter) {
        throw new Error("no gesture emitter component configured to handle gesture type: " + key);
      }
      gestureOptions.hammer = this.hammer;
      this._gestureEmitters[key] = new GestureEmitter(this.element, gestureOptions);
    }, this);
  },

  setBounds: function(bounds) {
    this.bounds = bounds;
  },

  destroy: function() {
    _.each(this._gestureEmitters, function(gestureEmitter, key) {
      if (_.isFunction(gestureEmitter.destroy)) {
        gestureEmitter.destroy();
      }
      delete this._gestureEmitters[key];
    }, this);
    this.hammer.destroy();
    this.unbindEvents(services.emitter, GestureHandler.emitterEvents);
  },

  /**
   * Records the start of a "pan" gesture.  This is used for calculating pan and swipe movements
   * relative to the start position.
   *
   * @param e - the hammer event for the panstart
   */
  setPanStart: function(e) {
    this.panStart = {
      event: e,
      x: dom.getStyle(this.element, "left", { parseInt: true }),
      y: dom.getStyle(this.element, "top", { parseInt: true })
    };
  },

  /**
   * Moves the element using the information in the given Hammer event object.
   *
   * @param e - hammer pan event object (from a panmove|panleft|panright|etc.)
   * @param elementRect - the bounding client rect of the element
   * @return {undefined}
   */
  move: function(e, elementRect) {
    elementRect = elementRect || rect.normalize(this.element);
    this.moveX(e, elementRect);
    this.moveY(e, elementRect);
  },

  /**
   * Moves the element horizontally, using the information in the given hammer event object.
   *
   * @param e
   * @param elementRect
   * @return {undefined}
   */
  moveX: function(e, elementRect) {
    elementRect = elementRect || rect.normalize(this.element);
    var x = this.panStart.x + e.deltaX;

    // Slow (scale down) the panning movement if pulling away from any edge
    if (this.bounds && this.snapping.distanceThreshold) {
      if (elementRect.left > this.bounds.left && ((elementRect.left - this.bounds.left) > this.snapping.distanceThreshold)) {
        x = this.panStart.x + this.snapping.distanceThreshold + ((e.deltaX - this.snapping.distanceThreshold) * this.snapping.scale);
      } else if (elementRect.right < this.bounds.right && ((this.bounds.right - elementRect.right) > this.snapping.distanceThreshold)) {
        x = this.panStart.x - this.snapping.distanceThreshold + ((e.deltaX + this.snapping.distanceThreshold) * this.snapping.scale);
      }
    }

    dom.setStyle(this.element, "left", x);

    services.emitter.emit(DecksEvent("gesture:element:moved", this, this.element));
  },

  /**
   * Moves the element vertically, using the information in the given hammer event object.
   *
   * @param e
   * @param elementRect
   * @return {undefined}
   */
  moveY: function(e, elementRect) {
    elementRect = elementRect || rect.normalize(this.element);
    var y = this.panStart.y + e.deltaY;

    // Slow (scale down) the panning movement if pulling away from any edge
    if (this.bounds && this.snapping.distanceThreshold) {
      if (elementRect.top > this.bounds.top && ((elementRect.top - this.bounds.top) > this.snapping.distanceThreshold)) {
        y = this.panStart.y + this.snapping.distanceThreshold + ((e.deltaY - this.snapping.distanceThreshold) * this.snapping.scale);
      } else if (elementRect.bottom < this.bounds.bottom && ((this.bounds.bottom  - elementRect.bottom) > this.snapping.distanceThreshold)) {
        y = this.panStart.y - this.snapping.distanceThreshold + ((e.deltaY + this.snapping.distanceThreshold) * this.snapping.scale);
      }
    }

    dom.setStyle(this.element, "top", y);

    services.emitter.emit(DecksEvent("gesture:element:moved", this, this.element));
  },

  /**
   * Starts a horizontal and/or vertical movement animation using the
   * information in the given Hammer event object.
   *
   * @param e
   * @return {undefined}
   */
  moveWithInertia: function(e) {
    var x = this.getMoveWithInertiaX(e);
    var y = this.getMoveWithInertiaY(e);
    var animateOptions = this.getMoveWithInertiaAnimateOptions(e.velocity);
    this.isAnimating = true;

    services.emitter.emit(DecksEvent("gesture:element:moving", this, this.element));
    services.animator.animate(this.element, { left: x, top: y }, animateOptions);
  },

  moveWithInertiaX: function(e) {
    var x = this.getMoveWithInertiaX(e);
    var animateOptions = this.getMoveWithInertiaAnimateOptions(e.velocityX);
    this.isAnimating = true;
    services.emitter.emit(DecksEvent("gesture:element:moving", this, this.element));
    services.animator.animate(this.element, { left: x }, animateOptions);
  },

  moveWithInertiaY: function(e) {
    var y = this.getMoveWithInertiaY(e);
    var animateOptions = this.getMoveWithInertiaAnimateOptions(e.velocityY);
    this.isAnimating = true;
    services.emitter.emit(DecksEvent("gesture:element:moving", this, this.element));
    services.animator.animate(this.element, { top: y }, animateOptions);
  },

  getMoveWithInertiaX: function(e) {
    return "-=" + (this.inertia.distanceScale * e.velocityX);
  },

  getMoveWithInertiaY: function(e) {
    return "-=" + (this.inertia.distanceScale * e.velocityY);
  },

  getMoveWithInertiaAnimateOptions: function(velocity) {
    return _.extend({
      begin: _.bind(this.onMoveWithInertiaBegin, this),
      progress: _.bind(this.onMoveWithInertiaProgress, this),
      complete: _.bind(this.onMoveWithInertiaComplete, this),
      duration: Math.abs(this.inertia.durationScale * velocity)
    }, this.inertia.animateOptions);
  },

  snapToBounds: function() {
    if (!this.bounds) {
      return;
    }

    var elementRect = rect.normalize(this.element);
    var transform = {};

    if (elementRect.top > this.bounds.top) {
      transform.top = 0;
    } else if (elementRect.bottom < this.bounds.bottom) {
      transform.top = "+=" + (this.bounds.bottom - elementRect.bottom);
    }

    if (elementRect.left > this.bounds.left) {
      transform.left = 0;
    } else if (elementRect.right < this.bounds.right) {
      transform.left = "+=" + (this.bounds.right - elementRect.right);
    }

    var animateOptions = _.extend({}, {
      begin: _.bind(this.onSnapToBoundsBegin, this),
      progress: _.bind(this.onSnapToBoundsProgress, this),
      complete: _.bind(this.onSnapToBoundsComplete, this)
    }, this.snapping.animateOptions);

    services.emitter.emit(DecksEvent("gesture:element:moving", this, this.element));

    services.animator.animate(this.element, transform, animateOptions);
  },

  onGesture: function(e) {
    if (services.config.debugGestures) {
      console.log(e.type /*, e.data*/);
    }
  },

  onGesturePanStart: function(e) {
    this.setPanStart(e.data);
  },

  onGesturePanAny: function(e) {
    if (!this.panStart) {
      this.setPanStart(e);
    }
    this.move(e.data);
  },

  onGesturePanX: function(e) {
    if (!this.panStart) {
      this.setPanStart(e);
    }
    this.moveX(e.data);
  },

  onGesturePanY: function(e) {
    if (!this.panStart) {
      this.setPanStart(e);
    }
    this.moveY(e.data);
  },

  onGesturePanEnd: function(/*e*/) {
    if (!this.isAnimating) {
      console.log("pan end - snap to bounds");
      this.snapToBounds();
    }
    this.panStart = null;
  },

  onGesturePanCancel: function(e) {
    console.log(e);
  },

  onGestureSwipeAny: function(e) {
    this.moveWithInertia(e.data);
  },

  onGestureSwipeX: function(e) {
    this.moveWithInertiaX(e.data);
  },

  onGestureSwipeY: function(e) {
    this.moveWithInertiaY(e.data);
  },

  onSnapToBoundsBegin: function() {
    this.isAnimating = true;
  },

  onSnapToBoundsProgress: function() {
  },

  onSnapToBoundsComplete: function() {
    this.isAnimating = false;
    services.emitter.emit(DecksEvent("gesture:element:moved", this, this.element));
  },

  onMoveWithInertiaBegin: function() {
    this.isAnimating = true;
  },

  onMoveWithInertiaProgress: function() {
  },

  onMoveWithInertiaComplete: function() {
    this.isAnimating = false;
    this.snapToBounds();
    services.emitter.emit(DecksEvent("gesture:element:moved", this, this.element));
  }
});

module.exports = GestureHandler;
