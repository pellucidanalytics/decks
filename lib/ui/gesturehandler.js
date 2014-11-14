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
var validate = require("../utils/validate");

/**
 * Object to bind and handle gesture events for a single DOM element.
 *
 * @class
 * @mixes binder
 * @mixes hasEmitter
 * @param {!Element} element - the element for which to bind and handle input gestures
 * @param {?Object} options - additional options
 */
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
    movement: {
      /**
       * If false, gestures will cause movements by changing/animating the element's top and left style.
       * If true, gestures will cause movements by animating element's scroll position.
       */
      scroll: false,

      /**
       * If scroll: true, the container element must be specified.
       */
      scrollContainerElement: null
    },
    snapping: {
      distanceThreshold: 40, // The pixel distance when pulling away from an edge, where movement resistance begins to be applied
      distanceScale: 0.5, // The scale factor for reducing movement when pulling away from an edge
      animateOptions: {
        duration: 200,
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
    validate(animator, "animator", { isPlainObject: true, isNotSet: this.animator });
    this.animator = animator;
  },

  setConfig: function(config) {
    validate(config, "config", { isPlainObject: true, isNotSet: this.config });
    this.config = config;
  },

  setElement: function(element) {
    validate(element, "element", { isElement: true, isNotSet: this.element });
    this.element = element;
    this.hammer = new Hammer(this.element);
  },

  setOptions: function(options) {
    validate(options, "options", { isRequired: true });

    this.movement = options.movement;
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
    validate(bounds, "bounds", { isRequired: true });
    if (rect.isEqual(this.bounds, bounds)) {
      return;
    }
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
      // If moving by top/left, record the starting top and left
      left: dom.getStyle(this.element, "left", { parseInt: true }),
      top: dom.getStyle(this.element, "top", { parseInt: true })
    };

    // If moving by scroll, record the starting scroll top and left
    if (this.movement.scroll) {
      _.extend(this.panStart, {
        scrollTop: this.movement.scrollContainerElement.scrollTop,
        scrollLeft: this.movement.scrollContainerElement.scrollLeft
      });
    }

    console.log("pan start", this.panStart);
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
    var self = this;

    if (this.movement.scroll) {
      this.animator.animate(this.element, "scroll", {
        axis: "x",
        offset: this.panStart.scrollTop - e.deltaX,
        container: this.movement.scrollContainerElement,
        duration: 0,
        queue: false,
        complete: function() {
          self.emit("gesture:element:moved", self, self.element);
        }
      });
    } else {
      elementRect = elementRect || rect.normalize(this.element);

      var left = this.panStart.left + e.deltaX;

      // If panning from left-to-right, and the element's left edge has gone past the left bounds, slow the left-to-right movement
      // If panning from right-to-left, and the element's right edge has gone past the right bounds, slow the right-to-left movement
      if (this.bounds && this.snapping.distanceThreshold) {
        if (elementRect.left > this.bounds.left && ((elementRect.left - this.bounds.left) > this.snapping.distanceThreshold)) {
          left = this.panStart.left + this.snapping.distanceThreshold + ((e.deltaX - this.snapping.distanceThreshold) * this.snapping.distanceScale);
        } else if (elementRect.right < this.bounds.right && ((this.bounds.right - elementRect.right) > this.snapping.distanceThreshold)) {
          left = this.panStart.left - this.snapping.distanceThreshold + ((e.deltaX + this.snapping.distanceThreshold) * this.snapping.distanceScale);
        }
      }

      /*
      this.animator.animate(this.element, {
        left: left
      }, {
        duration: 0,
        queue: false,
        complete: function() {
          self.emit(DecksEvent("gesture:element:moved", this, this.element));
        }
      });
      */

      dom.setStyle(this.element, "left", left);

      this.emit(DecksEvent("gesture:element:moved", this, this.element));
    }
  },

  /**
   * Moves the element vertically, using the information in the given hammer event object.
   *
   * @param e
   * @param elementRect
   * @return {undefined}
   */
  moveY: function(e, elementRect) {
    var self = this;

    //console.log("moveY", e);

    if (this.movement.scroll) {
      this.animator.animate(this.element, "scroll", {
        offset: this.panStart.scrollTop - e.deltaY,
        container: this.movement.scrollContainerElement,
        duration: 0,
        queue: false,
        complete: function() {
          self.emit("gesture:element:moved", self, self.element);
        }
      });
    } else {
      elementRect = elementRect || rect.normalize(this.element);

      var top = this.panStart.top + e.deltaY;

      // Slow (scale down) the panning movement if pulling away from any edge
      if (this.bounds && this.snapping.distanceThreshold) {
        if (elementRect.top > this.bounds.top && ((elementRect.top - this.bounds.top) > this.snapping.distanceThreshold)) {
          top = this.panStart.top + this.snapping.distanceThreshold + ((e.deltaY - this.snapping.distanceThreshold) * this.snapping.distanceScale);
        } else if (elementRect.bottom < this.bounds.bottom && ((this.bounds.bottom  - elementRect.bottom) > this.snapping.distanceThreshold)) {
          top = this.panStart.top - this.snapping.distanceThreshold + ((e.deltaY + this.snapping.distanceThreshold) * this.snapping.distanceScale);
        }
      }

      /*
      this.animator.animate(this.element, {
        top: top
      }, {
        duration: 0,
        queue: false,
        complete: function() {
          self.emit(DecksEvent("gesture:element:moved", this, this.element));
        }
      });
      */

      dom.setStyle(this.element, "top", top);

      this.emit(DecksEvent("gesture:element:moved", this, this.element));
    }
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

    if (this.movement.scroll) {
      this.animator.animate(this.element, "scroll", {
      });
    } else {
      this.animator.animate(this.element, {
        left: x,
        top: y
      }, animateOptions);
    }
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
    var self = this;
    return _.extend({
      begin: function(/*elements*/) {
        self.onMoveWithInertiaBegin();
      },
      progress: function(/*elements, percentComplete, timeRemaining, timeStart*/) {
        self.onMoveWithInertiaProgress();
      },
      complete: function(/*elements*/) {
        self.onMoveWithInertiaComplete();
      },
      duration: Math.abs(this.inertia.durationScale * velocity)
    }, this.inertia.animateOptions);
  },

  snapToBounds: function() {
    var self = this;

    // Snapping to bounds is only applicable for top/left movements (not scrolling)
    if (!self.bounds || self.movement.scroll) {
      return;
    }

    var elementRect = rect.normalize(self.element);
    var properties = {};

    if (elementRect.top > self.bounds.top) {
      // Top is above the top bounds, push it back down
      properties.top = 0;
    } else if (elementRect.bottom < self.bounds.bottom) {
      // Bottom is below the bottom bounds, push it back up
      properties.top = "+=" + (self.bounds.bottom - elementRect.bottom);
    }

    if (elementRect.left > self.bounds.left) {
      // Left is inside the left bounds, push it back to the right
      properties.left = 0;
    } else if (elementRect.right < self.bounds.right) {
      // Right is inside the right bounds, push it back to the left
      properties.left = "+=" + (self.bounds.right - elementRect.right);
    }

    if (_.isEmpty(properties)) {
      return;
    }

    var animateOptions = _.extend({
      complete: function(/*elements*/) {
        self.isAnimating = false;
        self.emit(DecksEvent("gesture:element:moved", self, self.element));
      }
    }, self.snapping.animateOptions);

    self.isAnimating = true;
    self.emit(DecksEvent("gesture:element:moving", self, self.element));
    self.animator.animate(self.element, properties, animateOptions);
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

  onGesturePanCancel: function(/*e*/) {
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

  onGestureTap: function(/*e*/) {
  },

  onGesturePress: function(/*e*/) {
  },

  onMoveWithInertiaComplete: function() {
    this.isAnimating = false;
    this.snapToBounds();
    this.emit(DecksEvent("gesture:element:moved", this, this.element));
  }
});

module.exports = GestureHandler;
