var _ = require("lodash");
var Hammer = require("hammerjs");
var binder = require("../events").binder;
var hasEmitter = require("../events").hasEmitter;
var dom = require("./dom");
var rect = require("../utils").rect;
var DecksEvent = require("../events").DecksEvent;
var PanEmitter = require("./panemitter");
var SwipeEmitter = require("./swipeemitter");
var MouseWheelEmitter = require("./mousewheelemitter");
var TapEmitter = require("./tapemitter");
var PressEmitter = require("./pressemitter");

function GestureHandler(element, options) {
  if (!(this instanceof GestureHandler)) {
    return new GestureHandler(element, options);
  }

  options = _.merge({}, this.defaultOptions, options);

  this.gestureEmitters = {};

  this.setAnimator(options.animator);
  this.setConfig(options.config);
  this.setEmitter(options.emitter || {}, this.emitterEvents);
  this.setElement(element);
  this.setOptions(options);
}

_.extend(GestureHandler.prototype, binder, hasEmitter, /** @lends GestureHandler.prototype */ {
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
      },
      tap: {
        enabled: true
      },
      press: {
        enabled: true
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
      distanceScale: 400, // used to calculate the movement distance for an inertia-based movement (swipe gesture)
      durationScale: 60, // used to calculate the movement duration for an inertia-based movement (swipe gesture)
      animateOptions: {
        easing: "easeOutExpo"
      }
    }
  },

  emitterEvents: {
    "gesture:**": "onGesture",
    "gesture:pan:start": "onGesturePanStart",
    "gesture:pan:any": "onGesturePanAny",
    "gesture:pan:x": "onGesturePanX",
    "gesture:pan:y": "onGesturePanY",
    "gesture:pan:end": "onGesturePanEnd",
    "gesture:pan:cancel": "onGesturePanCancel",
    "gesture:swipe:any": "onGestureSwipeAny",
    "gesture:swipe:x": "onGestureSwipeX",
    "gesture:swipe:y": "onGestureSwipeY",
    "gesture:tap": "onGestureTap",
    "gesture:press": "onGesturePress"
  },

  /**
   * Mapping of gesture names to gesture emitter component constructor functions
   */
  gestureEmitterTypes: {
    pan: PanEmitter,
    swipe: SwipeEmitter,
    mouseWheel: MouseWheelEmitter,
    tap: TapEmitter,
    press: PressEmitter
  },

  setAnimator: function(animator) {
    if (!animator) {
      throw new Error("GestureHandler#setAnimator: animator is required");
    }

    if (this.animator) {
      throw new Error("GestureHandler#setAnimator: animator already set");
    }

    this.animator = animator;
  },

  setConfig: function(config) {
    if (!config) {
      throw new Error("GestureHandler.#setConfig: config is required");
    }

    if (this.config) {
      throw new Error("GestureHandler.#setConfig: config already set");
    }

    this.config = config;
  },

  setElement: function(element) {
    if (!_.isElement(element)) {
      throw new Error("GestureHandler#setElement: element is required and must be an Element");
    }

    if (this.element) {
      throw new Error("GestureHandler#setElement: element already set");
    }

    this.element = element;
    this.hammer = new Hammer(this.element);
  },

  setOptions: function(options) {
    if (!options) {
      throw new Error("GestureHandler#setOptions: options is required");
    }

    this.setBounds(options.bounds || null);
    this.snapping = options.snapping;
    this.inertia = options.inertia;

    // Create and init each GestureEmitter instance
    _.each(options.gestures, function(gestureEmitterOptions, key) {
      if (!gestureEmitterOptions.enabled) {
        return;
      }

      var GestureEmitter = this.gestureEmitterTypes[key];

      if (!GestureEmitter) {
        throw new Error("GestureHandler#setOptions: no gesture emitter component configured to handle gesture type: " + key);
      }

      _.extend(gestureEmitterOptions, {
        hammer: this.hammer,
        emitter: this.emitter
      });

      this.gestureEmitters[key] = new GestureEmitter(this.element, gestureEmitterOptions);
    }, this);
  },

  setBounds: function(bounds) {
    this.bounds = bounds;
  },

  destroy: function() {
    _.each(this.gestureEmitters, function(gestureEmitter, key) {
      if (this.config.debugGestures) {
        console.log("GestureHandler#destroy: destroying gesture emitter: " + key);
      }

      if (_.isFunction(gestureEmitter.destroy)) {
        gestureEmitter.destroy();
      }

      delete this.gestureEmitters[key];
    }, this);

    if (this.config.debugGestures) {
      console.log("GestureHandler#destroy: destroying hammer: ", this.hammer);
    }

    this.hammer.destroy();
    delete this.hammer;

    this.unbindEvents(this.emitter, this.emitterEvents);
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
        x = this.panStart.x + this.snapping.distanceThreshold + ((e.deltaX - this.snapping.distanceThreshold) * this.snapping.distanceScale);
      } else if (elementRect.right < this.bounds.right && ((this.bounds.right - elementRect.right) > this.snapping.distanceThreshold)) {
        x = this.panStart.x - this.snapping.distanceThreshold + ((e.deltaX + this.snapping.distanceThreshold) * this.snapping.distanceScale);
      }
    }

    dom.setStyle(this.element, "left", x);

    this.emit(DecksEvent("gesture:element:moved", this, this.element));
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
        y = this.panStart.y + this.snapping.distanceThreshold + ((e.deltaY - this.snapping.distanceThreshold) * this.snapping.distanceScale);
      } else if (elementRect.bottom < this.bounds.bottom && ((this.bounds.bottom  - elementRect.bottom) > this.snapping.distanceThreshold)) {
        y = this.panStart.y - this.snapping.distanceThreshold + ((e.deltaY + this.snapping.distanceThreshold) * this.snapping.distanceScale);
      }
    }

    dom.setStyle(this.element, "top", y);

    this.emit(DecksEvent("gesture:element:moved", this, this.element));
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

    this.emit(DecksEvent("gesture:element:moving", this, this.element));

    this.animator.animate(this.element, { left: x, top: y }, animateOptions);
  },

  moveWithInertiaX: function(e) {
    var x = this.getMoveWithInertiaX(e);
    var animateOptions = this.getMoveWithInertiaAnimateOptions(e.velocityX);

    this.isAnimating = true;

    this.emit(DecksEvent("gesture:element:moving", this, this.element));

    this.animator.animate(this.element, { left: x }, animateOptions);
  },

  moveWithInertiaY: function(e) {
    var y = this.getMoveWithInertiaY(e);
    var animateOptions = this.getMoveWithInertiaAnimateOptions(e.velocityY);

    this.isAnimating = true;

    this.emit(DecksEvent("gesture:element:moving", this, this.element));

    this.animator.animate(this.element, { top: y }, animateOptions);
  },

  getMoveWithInertiaX: function(e) {
    var endX = this.inertia.distanceScale * e.velocityX;
    return "-=" + endX;
  },

  getMoveWithInertiaY: function(e) {
    var endY = this.inertia.distanceScale * e.velocityY;
    return "-=" + endY;
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

    this.emit(DecksEvent("gesture:element:moving", this, this.element));

    this.animator.animate(this.element, transform, animateOptions);
  },

  onGesture: function(e) {
    if (this.config.debugGestures) {
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
      if (this.config.debugGestures) {
        console.log("GestureHandler#onGesturePanEnd: snap to bounds");
      }
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

  onGestureTap: function(e) {
    console.log("tap", e);
  },

  onGesturePress: function(e) {
    console.log("press", e);
  },

  onSnapToBoundsBegin: function() {
    this.isAnimating = true;
  },

  onSnapToBoundsProgress: function() {
  },

  onSnapToBoundsComplete: function() {
    this.isAnimating = false;
    this.emit(DecksEvent("gesture:element:moved", this, this.element));
  },

  onMoveWithInertiaBegin: function() {
    this.isAnimating = true;
  },

  onMoveWithInertiaProgress: function() {
  },

  onMoveWithInertiaComplete: function() {
    this.isAnimating = false;
    this.snapToBounds();
    this.emit(DecksEvent("gesture:element:moved", this, this.element));
  }
});

module.exports = GestureHandler;
