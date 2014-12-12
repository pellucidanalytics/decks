var _ = require("lodash");
var Hammer = require("hammerjs");
var binder = require("../events").binder;
var hasEmitter = require("../events").hasEmitter;
var dom = require("../ui/dom");
var rect = require("../utils").rect;
var DecksEvent = require("../events").DecksEvent;
var PanEmitter = require("./panemitter");
var SwipeEmitter = require("./swipeemitter");
var MouseWheelEmitter = require("./mousewheelemitter");
var MouseOverOutEmitter = require("./mouseoveroutemitter");
var MouseEnterLeaveEmitter = require("./mouseenterleaveemitter");
var TapEmitter = require("./tapemitter");
var PressEmitter = require("./pressemitter");
var ScrollEmitter = require("./scrollemitter");
var validate = require("../utils/validate");
//var raf = require("raf");

/**
 * Object to bind and handle gesture events for a single DOM element.
 *
 * @class
 * @mixes binder
 * @mixes hasEmitter
 * @param {!Object} options - additional options
 * @param {!Element} options.element - element for which to handle gestures
 * @param {?Emitter} [options.emitter={}] - {@link Emitter} instance or options
 * @param {!Object} options.animator - animator object
 * @param {!Object} options.config - config object
 * @param {?Object} options.gestures - gesture emitter options
 * @param {?Element} options.containerElement - container element for this element
 * @param {?Object} options.bounds - rectangle-like boundary for gestures/animations
 */
function GestureHandler(options) {
  if (!(this instanceof GestureHandler)) {
    return new GestureHandler(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  this.gestureEmitters = {};
  this.animationCount = 0;
  this.debouncedOnGestureScroll = _.debounce(this.onGestureScroll, options.movement.debouncedScrollWait);

  this.setAnimator(options.animator);
  this.setConfig(options.config);
  this.setEmitter(options.emitter || {});
  this.setElement(options.element);
  this.setOptions(options);

  this.bind();
}

_.extend(GestureHandler.prototype, binder, hasEmitter, /** @lends GestureHandler.prototype */ {
  /**
   * Default options to use with a GestureHandler instance.
   */
  defaultOptions: {
    /**
     * Gesture types
     */
    gestures: {
      /**
       * Mousewheel events
       */
      mouseWheel: {
        enabled: false,
        horizontal: true,
        vertical: true
      },

      /**
       * Mouse over/out events
       */
      mouseOverOut: {
        enabled: false,
        over: true,
        out: true
      },

      /**
       * Mouse enter/leave events
       */
      mouseEnterLeave: {
        enabled: false,
        enter: true,
        leave: true
      },

      /**
       * Pan events
       */
      pan: {
        enabled: false,
        horizontal: false,
        vertical: true
      },

      /**
       * Swipe events
       */
      swipe: {
        enabled: false,
        horizontal: false,
        vertical: true
      },

      /**
       * Tap events
       */
      tap: {
        enabled: false
      },

      /**
       * Press events
       */
      press: {
        enabled: false
      },

      /**
       * Scroll events (on the container)
       */
      scroll: {
        enabled: false
      }
    },

    /**
     * The container element in which this element resides
     */
    containerElement: null,

    /**
     * Boundary for animations/gestures (can be a real element bounds, or just virtual bounds)
     */
    bounds: null,

    /**
     * Function which provides additional x/y offsets to apply when animating to a child element
     * e.g. for snap to nearest child element, or move to element
     */
    getMoveToElementOffsets: function() {
      return {
        x: 0,
        y: 0
      };
    },

    /**
     * Movement options
     */
    movement: {
      scroll: false, // false: move by changing top/left, true: move by changing scrollTop/scrollLeft on container
      debouncedScrollWait: 600,
      swipingTimeout: 30,
      animateOptions: {
        duration: 500,
        easing: "easeInOutCubic"
      }
    },

    /**
     * Snapping options
     */
    snapping: {
      toBounds: false,
      toNearestChildElement: false,
      childElementSelector: ".decks-item",
      reduceMovementAtBounds: false,
      hardStopAtBounds: false,
      distanceThreshold: 40, // The pixel distance when pulling away from an edge, where movement resistance begins to be applied
      distanceScale: 0.5, // The scale factor for reducing movement when pulling away from an edge
      animateOptions: {
        duration: 500,
        easing: [500, 20] // tension (default 500), friction (default 20)
      }
    },

    /**
     * Inertial movement options
     */
    inertia: {
      distanceScale: 500, // 400 used to calculate the movement distance for an inertia-based movement (swipe gesture)
      durationScale: 500, // 60 used to calculate the movement duration for an inertia-based movement (swipe gesture)
      animateOptions: {
        easing: "easeOutCubic"
      }
    }
  },

  /**
   * Mapping of gesture names to gesture emitter component constructor functions
   */
  gestureEmitterTypes: {
    pan: PanEmitter,
    swipe: SwipeEmitter,
    mouseWheel: MouseWheelEmitter,
    mouseOverOut: MouseOverOutEmitter,
    mouseEnterLeave: MouseEnterLeaveEmitter,
    tap: TapEmitter,
    press: PressEmitter,
    scroll: ScrollEmitter
  },

  getEmitterEvents: function() {
    return {
      // Pan gestures - linear tracking movement
      "gesture:pan:start": "onGesturePanStart",
      "gesture:pan:any": "onGesturePanAny",
      "gesture:pan:x": "onGesturePanX",
      "gesture:pan:y": "onGesturePanY",
      "gesture:pan:end": "onGesturePanEnd",
      "gesture:pan:cancel": "onGesturePanCancel",

      // Swipe gestures - inertial movement in swipe direction
      "gesture:swipe:any": "onGestureSwipeAny",
      "gesture:swipe:x": "onGestureSwipeX",
      "gesture:swipe:y": "onGestureSwipeY",

      // Tap/press gestures
      "gesture:tap": "onGestureTap",
      "gesture:press": "onGesturePress",

      // Scroll
      "gesture:scroll": "debouncedOnGestureScroll"
    };
  },

  /**
   * Binds all {@link GestureHandler} events handlers.
   *
   * @return {undefined}
   */
  bind: function bind() {
    this.bindEvents(this.emitter, this.getEmitterEvents());
  },

  /**
   * Unbinds all {@link GestureHandler} event handlers.
   *
   * @return {undefined}
   */
  unbind: function unbind() {
    this.unbindEvents(this.emitter, this.getEmitterEvents());
  },

  /**
   * Destroys the GestureHandler and all GestureEmitter instances
   *
   * @return {undefined}
   */
  destroy: function destroy() {
    _.each(this.gestureEmitters, function(gestureEmitter, key) {
      if (this.config.debugGestures) {
        console.log("GestureHandler#destroy: destroying gesture emitter: " + key);
      }

      gestureEmitter.destroy();

      delete this.gestureEmitters[key];
    }, this);

    if (this.config.debugGestures) {
      console.log("GestureHandler#destroy: destroying hammer: ", this.hammer);
    }

    // Destory the Hammer instance
    this.hammer.destroy();
    delete this.hammer;

    this.unbind();
  },

  /**
   * Sets the animator instance
   *
   * @param animator
   * @return {undefined}
   */
  setAnimator: function setAnimator(animator) {
    validate(animator, "GestureHandler#setAnimator: animator", { isPlainObject: true, isNotSet: this.animator });
    this.animator = animator;
  },

  /**
   * Sets the config instance
   *
   * @param config
   * @return {undefined}
   */
  setConfig: function setConfig(config) {
    validate(config, "GestureHandler#setConfig: config", { isPlainObject: true, isNotSet: this.config });
    this.config = config;
  },

  /**
   * Sets the element instance
   *
   * @param element
   * @return {undefined}
   */
  setElement: function setElement(element) {
    validate(element, "GestureHandler#setElement: element", { isElement: true, isNotSet: this.element });
    this.element = element;
    this.hammer = new Hammer(this.element);
  },

  /**
   * Sets GestureHandler options
   *
   * @param options
   * @return {undefined}
   */
  setOptions: function setOptions(options) {
    validate(options, "GestureHandler#setOptions: options", { isRequired: true });

    // Container element (optional)
    this.containerElement = options.containerElement;

    // Bounds (optional)
    this.setBounds(options.bounds);

    // Movement options
    this.movement = options.movement;

    if (this.movement.scroll && !_.isElement(this.containerElement)) {
      throw new Error("GestureHandler#setOptions: for options.movement.scroll === true, options.containerElement must be an element");
    }

    // Snapping options
    this.snapping = options.snapping;

    if (this.snapping.toBounds && !this.bounds) {
      throw new Error("GestureHandler#setOptions: for options.snapping.toBounds === true, options.bounds is required");
    }

    if (this.snapping.toNearestChildElement && !_.isString(this.snapping.childElementSelector)) {
      throw new Error("GestureHandler#setOptions: for options.snapping.toNearestChildElement === true, options.snapping.childElementSelector is required");
    }

    // Inertia options
    this.inertia = options.inertia;

    // Other callbacks/etc.
    if (!_.isFunction(options.getMoveToElementOffsets)) {
      throw new Error("GestureHandler#setOptions: getMoveToElementOffsets must be a function");
    }

    this.getMoveToElementOffsets = options.getMoveToElementOffsets;

    // Gesture types
    _.each(options.gestures, function(gestureEmitterOptions, key) {
      // Get the constructor function for this type of gesture emitter
      var GestureEmitter = this.gestureEmitterTypes[key];

      if (!GestureEmitter) {
        throw new Error("GestureHandler#setOptions: no gesture emitter component configured to handle gesture type: " + key);
      }

      var element = this.element;

      if (key === "scroll") {
        // Scroll emitter must be on the container element, not the element itself
        element = this.containerElement || this.element;
        gestureEmitterOptions.enabled = gestureEmitterOptions.enabled && this.movement.scroll;

        if (gestureEmitterOptions.enabled && !this.containerElement) {
          if (!this.containerElement) {
            throw new Error("GestureHandler#setOptions: for scroll gestures, options.containerElement is required");
          }
        }
      }

      _.extend(gestureEmitterOptions, {
        element: element,
        hammer: this.hammer,
        emitter: this.emitter
      });

      this.gestureEmitters[key] = new GestureEmitter(gestureEmitterOptions);
    }, this);
  },

  /**
   * Sets the bounds for the gestures/animations
   *
   * @param bounds
   * @return {undefined}
   */
  setBounds: function setBounds(bounds) {
    if (!bounds && _.isElement(this.containerElement)) {
      bounds = rect.normalize(this.containerElement);
    }

    if (rect.isEqual(this.bounds, bounds)) {
      return;
    }

    this.bounds = bounds;
  },

  /**
   * Updates the current position data (and sets the start position if not set)
   *
   * @param e
   * @return {undefined}
   */
  updatePositionData: function updatePositionData(e) {
    this.currentPosition = {
      event: e
    };

    // If moving by scroll, record the starting scroll top and left, otherwise, record the style top and left
    if (this.movement.scroll) {
      _.extend(this.currentPosition, {
        scrollTop: this.containerElement.scrollTop,
        scrollLeft: this.containerElement.scrollLeft
      });
    } else {
      _.extend(this.currentPosition, rect.normalize(this.element));
    }

    /*
    if (this.config.debugGestures) {
      console.log("set current position " + this.element.id, this.currentPosition);
    }
    */

    if (!this.startPosition) {
      this.startPosition = this.currentPosition;

      if (this.element.parentNode) {
        this.parentPosition = rect.normalize(this.element.parentNode);
      }

      /*
      if (this.config.debugGestures) {
        console.log("set start position " + this.element.id, this.startPosition);
      }
      */
    }
  },

  /**
   * Clears the current and start position data
   *
   * @return {undefined}
   */
  clearPositionData: function clearPositionData() {
    if (this.config.debugGestures) {
      console.log("clear position", this.element.id);
    }
    this.startPosition = null;
    this.currentPosition = null;
    this.parentPosition = null;
  },

  /**
   * Indicates if the element has any animation running currently.
   *
   * @return {undefined}
   */
  isAnimating: function isAnimating() {
    return this.animationCount > 0;
  },

  /**
   * Stops the current animation (if possible) and clears the animation queue for the element
   *
   * Note: only queued animations can be stopped.  Animations with "queue: false" don't seem
   * to be stoppable.
   *
   * @return {undefined}
   */
  stopAnimation: function stopAnimation() {
    if (this.config.debugGestures) {
      console.log("stop", this.element.id);
    }
    this.animator.animate(this.element, "stop", true);
    this.animationCount = 0;
  },

  /**
   * Moves the element using the information in the given Hammer event object.
   *
   * @param e - hammer pan event object (from a panmove|panleft|panright|etc.)
   * @param elementRect - the bounding client rect of the element
   * @return {undefined}
   */
  animateMoveForPan: function animateMoveForPan(e, animateOptions, beginOptions, completeOptions) {
    completeOptions.waitForXAndY = true;
    this.animateMoveForPanX(e, animateOptions, beginOptions, completeOptions);
    this.animateMoveForPanY(e, animateOptions, beginOptions, completeOptions);
  },

  /**
   * Moves the element horizontally, using the information in the given hammer event object.
   *
   * @param e
   * @param elementRect
   * @return {undefined}
   */
  animateMoveForPanX: function animateMoveForPanX(e, animateOptions, beginOptions, completeOptions) {
    var x;

    if (this.movement.scroll) {
      x = this.startPosition.scrollLeft - e.deltaX;
    } else {
      x = this.startPosition.left - this.parentPosition.left + e.deltaX;

      // Limit movement if the user is dragging the element towards the inside of the container bounds
      if (this.snapping.reduceMovementAtBounds && this.bounds && this.snapping.distanceThreshold) {
        if ((this.currentPosition.left - this.bounds.left) > this.snapping.distanceThreshold) {
          x = (this.startPosition.left + this.snapping.distanceThreshold) +
            ((e.deltaX - this.snapping.distanceThreshold) * this.snapping.distanceScale);
        } else if ((this.bounds.right - this.currentPosition.right) > this.snapping.distanceThreshold) {
          x = (this.startPosition.left - this.snapping.distanceThreshold) +
            ((e.deltaX + this.snapping.distanceThreshold) * this.snapping.distanceScale);
        }
      }

      // Don't allow pan movement to go beyond bounds
      if (this.snapping.hardStopAtBounds) {
        if (x + this.currentPosition.width + this.parentPosition.left > this.bounds.right) {
          x = this.bounds.right - this.currentPosition.width - this.parentPosition.left;
        }

        if (x + this.parentPosition.left < this.bounds.left) {
          x = this.bounds.left - this.parentPosition.left;
        }
      }
    }

    _.extend(animateOptions, {
      duration: 0 // Immediate animation for pan movements
    });

    _.extend(completeOptions, {
      snapToBounds: false, // Don't snap to bounds for single pan events (wait for pan end)
      snapToNearestChildElement: false, // Don't snap for single pan events (wait for pan end)
      clearPositionData: false // Don't clear position data, because pan events need the past data
    });

    this.animateMoveX(x, animateOptions, beginOptions, completeOptions);
  },

  /**
   * Moves the element vertically, using the information in the given hammer event object.
   *
   * @param e
   * @param elementRect
   * @return {undefined}
   */
  animateMoveForPanY: function animateMoveForPanY(e, animateOptions, beginOptions, completeOptions) {
    var y;

    if (this.movement.scroll) {
      y = this.startPosition.scrollTop - e.deltaY;
    } else {
      y = this.startPosition.top - this.parentPosition.top + e.deltaY;

      // Limit movement if the user is dragging the element towards the inside of the container bounds
      if (this.snapping.reduceMovementAtBounds && this.bounds && this.snapping.distanceThreshold) {
        if ((this.currentPosition.top - this.bounds.top) > this.snapping.distanceThreshold) {
          y = (this.startPosition.top + this.snapping.distanceThreshold) +
            ((e.deltaY - this.snapping.distanceThreshold) * this.snapping.distanceScale);
        } else if ((this.bounds.bottom - this.currentPosition.bottom) > this.snapping.distanceThreshold) {
          y = (this.startPosition.top - this.snapping.distanceThreshold) +
            ((e.deltaY + this.snapping.distanceThreshold) * this.snapping.distanceScale);
        }
      }

      // Don't allow the pan position to go beyond bounds
      if (this.snapping.hardStopAtBounds) {
        if (y + this.currentPosition.height + this.parentPosition.top > this.bounds.bottom) {
          y = this.bounds.bottom - this.currentPosition.height - this.parentPosition.top;
        }

        if (y + this.parentPosition.top < this.bounds.top) {
          y = this.bounds.top - this.parentPosition.top;
        }
      }
    }

    _.extend(animateOptions, {
      duration: 0 // Immediate animation for pan movements
    });

    _.extend(completeOptions, {
      snapToBounds: false, // Don't snap to bounds for pans (do it on pan end)
      snapToNearestChildElement: false, // Don't snap to bounds for pans (do it on pan end)
      clearPositionData: false // Don't clear position data - pan movements need past data
    });

    this.animateMoveY(y, animateOptions, beginOptions, completeOptions);
  },

  /**
   * Starts a horizontal and/or vertical movement animation using the
   * information in the given Hammer event object.
   *
   * @param e
   * @return {undefined}
   */
  animateMoveForSwipe: function animateMoveForSwipe(e, animateOptions, beginOptions, completeOptions) {
    completeOptions.waitForXAndY = true;
    this.animateMoveForSwipeX(e, animateOptions, beginOptions, completeOptions);
    this.animateMoveForSwipeY(e, animateOptions, beginOptions, completeOptions);
  },

  /**
   * Starts an animation for a swipe gesture in the horizontal direction.
   *
   * @param e
   * @param animateOptions
   * @param beginOptions
   * @param completeOptions
   * @return {undefined}
   */
  animateMoveForSwipeX: function animateMoveForSwipeX(e, animateOptions, beginOptions, completeOptions) {
    var distance = this.getInertiaDistance(e.velocityX);
    var duration = this.getInertiaDuration(e.velocityX);
    var x;

    if (this.movement.scroll) {
      x = this.currentPosition.scrollLeft + distance;
    } else {
      x = "-=" + distance;

      if (this.snapping.hardStopAtBounds) {
        /*
        if (this.element.id === "decks-item-1-0") {
          console.log("----------");
          console.log("this.element.id", this.element.id);
          console.log("this.startPosition", this.startPosition);
          console.log("this.currentPosition", this.currentPosition);
          console.log("this.parentPosition", this.parentPosition);
          console.log("this.bounds", this.bounds);
          console.log("distance", distance);
        }
        */
        if (distance > 0) {
          //console.log("left");
          // If moving to the left, stop the element at the left bounds
          if (this.currentPosition.left - distance < this.bounds.left) {
            x = this.bounds.left - this.parentPosition.left;
            duration = duration * (this.currentPosition.left - this.bounds.left) / distance;
          }
        } else {
          //console.log("right");
          // If moving to the right, stop the element at the right bounds
          if (this.currentPosition.right - distance > this.bounds.right) {
            x = this.bounds.right - this.currentPosition.width - this.parentPosition.left;
            duration = duration * (this.bounds.right - this.currentPosition.right) / -distance;
          }
        }
      }
    }

    //console.log("duration", duration);

    _.extend(animateOptions, this.inertia.animateOptions, {
      duration: duration
    });

    _.extend(completeOptions, {
      snapToBounds: false,
      snapToNearestChildElement: true,
      clearPositionData: true
    });


    this.animateMoveX(x, animateOptions, beginOptions, completeOptions);
  },

  /**
   * Starts an animation for a swipe gestures in the vertical direction.
   *
   * @param e
   * @param animateOptions
   * @param beginOptions
   * @param completeOptions
   * @return {undefined}
   */
  animateMoveForSwipeY: function animateMoveForSwipeY(e, animateOptions, beginOptions, completeOptions) {
    var distance = this.getInertiaDistance(e.velocityY);
    var duration = this.getInertiaDuration(e.velocityY);
    var y;

    if (this.movement.scroll) {
      y = this.currentPosition.scrollTop + distance;
    } else {
      y = "-=" + distance;

      if (this.snapping.hardStopAtBounds) {
        /*
        if (this.element.id === "decks-item-1-0") {
          console.log("----------");
          console.log("this.element.id", this.element.id);
          console.log("this.startPosition", this.startPosition);
          console.log("this.currentPosition", this.currentPosition);
          console.log("this.parentPosition", this.parentPosition);
          console.log("this.bounds", this.bounds);
          console.log("distance", distance);
        }
        */
        if (distance > 0) {
          // If moving top, stop the element at the top bounds
          if (this.currentPosition.top - distance < this.bounds.top) {
            y = this.bounds.top - this.parentPosition.top;
            duration = duration * (this.currentPosition.top - this.bounds.top) / distance;
          }
        } else {
          // If moving , stop the element at the bottom bounds
          if (this.currentPosition.bottom - distance > this.bounds.bottom) {
            y = this.bounds.bottom - this.currentPosition.width - this.parentPosition.top;
            duration = duration * (this.bounds.bottom - this.currentPosition.bottom) / -distance;
          }
        }
      }
    }

    _.extend(animateOptions, this.inertia.animateOptions, {
      duration: duration
    });

    _.extend(completeOptions, {
      snapToBounds: false,
      snapToNearestChildElement: true,
      clearPositionData: true
    });

    this.animateMoveY(y, animateOptions, beginOptions, completeOptions);
  },

  /**
   * Animates a movement in the horizontal direction.
   *
   * @param x
   * @param animateOptions
   * @param beginOptions
   * @param completeOptions
   * @return {undefined}
   */
  animateMoveX: function animateMoveX(x, animateOptions, beginOptions, completeOptions) {
    this.animateMoveXOrY(x, "x", animateOptions, beginOptions, completeOptions);
  },

  /**
   * Animates a movement in the vertical direction.
   *
   * @param y
   * @param animateOptions
   * @param beginOptions
   * @param completeOptions
   * @return {undefined}
   */
  animateMoveY: function animateMoveY(y, animateOptions, beginOptions, completeOptions) {
    this.animateMoveXOrY(y, "y", animateOptions, beginOptions, completeOptions);
  },

  /**
   * Animates a movement in the horizontal and vertical directions.
   *
   * @param x
   * @param y
   * @param animateOptions
   * @param beginOptions
   * @param completeOptions
   * @return {undefined}
   */
  animateMoveXAndY: function animateMoveXAndY(x, y, animateOptions, beginOptions, completeOptions) {
    completeOptions.waitForXAndY = true;
    this.animateMoveX(x, animateOptions, beginOptions, completeOptions);
    this.animateMoveY(y, animateOptions, beginOptions, completeOptions);
  },

  /**
   * Animates a move in the horizontal or vertical direction (based on axis parameter)
   *
   * @param value
   * @param axis
   * @param animateOptions
   * @param beginOptions
   * @param completeOptions
   * @return {undefined}
   */
  animateMoveXOrY: function animateMoveXOrY(value, axis, animateOptions, beginOptions, completeOptions) {
    var self = this;
    var transform;

    if (self.movement.scroll) {
      transform = "scroll";
      animateOptions.offset = value;
      animateOptions.axis = axis;
      animateOptions.container = self.containerElement;
    } else {
      transform = {};
      if (axis === "x") {
        transform.left = value;
      } else {
        transform.top = value;
      }
    }

    // If waiting for x and y, wait for 2 invocations of the complete function
    // before actually calling it
    completeOptions.callCount = 0;

    animateOptions = _.extend({
      queue: false, // Don't queue any movement animations, they need to be immediate (or in parallel), and not queued to run in series
      complete: function() {
        if (completeOptions.waitForXAndY) {
          completeOptions.callCount++;
          if (completeOptions.callCount < 2) {
            return;
          }
        }
        self.onAnimationComplete(completeOptions);
      }
    }, this.movement.animateOptions, animateOptions);

    if (!beginOptions.silent) {
      this.emit(DecksEvent("gesture:element:moving", this, this.element));
    }

    self.animationCount++;
    self.animator.animate(self.element, transform, animateOptions);
  },

  /**
   * Gets the distance to travel for an inertial movement.
   *
   * @param velocity
   * @return {undefined}
   */
  getInertiaDistance: function getInertiaDistance(velocity) {
    return this.inertia.distanceScale * velocity;
  },

  /**
   * Gets the animation duration for an inertial movement.
   *
   * @param velocity
   * @return {undefined}
   */
  getInertiaDuration: function getInertiaDuration(velocity) {
    return Math.abs(this.inertia.durationScale * velocity);
  },

  /**
   * Animates a movement to reset the element to its origin position (0, 0).
   *
   * @return {undefined}
   */
  resetPosition: function resetPosition() {
    var animateOptions = {};
    var beginOptions = {};
    var completeOptions = {
      description: "reset position",
      waitForXAndY: true,
      snapToBounds: false,
      snapToNearestChildElement: false,
      clearPositionData: true
    };

    this.animateMoveXAndY(0, 0, animateOptions, beginOptions, completeOptions);
  },

  /**
   * Animates a movement to move the element to a position near the given child element.
   *
   * @param element
   * @param animateOptions
   * @param beginOptions
   * @param completeOptions
   * @return {undefined}
   */
  animateMoveToElement: function animateMoveToElement(element, animateOptions, beginOptions, completeOptions) {
    validate(element, "GestureHandler#animateMoveToElement: element", { isElement: true });

    var left = dom.getStyle(element, "left", { parseFloat: true });
    var top = dom.getStyle(element, "top", { parseFloat: true });

    var offsets = this.getMoveToElementOffsets(element);
    var x = left + offsets.x;
    var y = top + offsets.y;

    animateOptions = _.extend({}, animateOptions);
    beginOptions = _.extend({}, beginOptions);
    completeOptions = _.extend({
      description: "animateMoveToElement",
      waitForXAndY: true,
      snapToBounds: true,
      snapToNearestChildElement: false,
      clearPositionData: true,
      event: DecksEvent("gesture:moved:to:element", this, element)
    }, completeOptions);

    this.animateMoveXAndY(x, y, animateOptions, beginOptions, completeOptions);
  },

  /**
   * Snaps the element's position back to within its movement boundary.
   *
   * @return {undefined}
   */
  snapToBounds: function snapToBounds() {
    var self = this;

    // If we don't have container bounds, we can't snap to anything.
    // If we are moving by scrolling, we can't snap, because the browser doesn't let you pull the element inside the bounds.
    if (!self.bounds || self.movement.scroll) {
      return;
    }

    if (this.config.debugGestures) {
      console.log("snap bounds");
    }

    var x;
    if (this.currentPosition.left > self.bounds.left) {
      //x = 0;
      x = self.bounds.left - self.parentPosition.left;
    } else if (this.currentPosition.right < self.bounds.right) {
      x = "+=" + (self.bounds.right - this.currentPosition.right);
    }

    var y;
    if (this.currentPosition.top > self.bounds.top) {
      //y = 0;
      y = self.bounds.top - self.parentPosition.top;
    } else if (this.currentPosition.bottom < self.bounds.bottom) {
      y = "+=" + (self.bounds.bottom - this.currentPosition.bottom);
    }

    var animateOptions = _.extend({}, this.snapping.animateOptions);
    var beginOptions = {};
    var completeOptions = {
      description: "snap to bounds",
      snapToBounds: false,
      snapToNearestChildElement: false,
      clearPositionData: true,
      event: DecksEvent("gesture:snapped:to:container:bounds", this, this.element)
    };

    if (!_.isUndefined(x) && !_.isUndefined(y)) {
      this.animateMoveXAndY(x, y, animateOptions, beginOptions, completeOptions);
    } else if (!_.isUndefined(x)) {
      this.animateMoveX(x, animateOptions, beginOptions, completeOptions);
    } else if (!_.isUndefined(y)) {
      this.animateMoveY(y, animateOptions, beginOptions, completeOptions);
    }
  },

  /**
   * Snaps the element's position to a nearby child element.
   *
   * @return {undefined}
   */
  snapToNearestChildElement: function snapToNearestChildElement() {
    if (!this.snapping.toNearestChildElement || !_.isString(this.snapping.childElementSelector) || !this.bounds) {
      return;
    }

    if (this.config.debugGestures) {
      console.log("snap to nearest child element");
    }

    var childElements = dom.query(this.snapping.childElementSelector, this.containerElement);
    var nearestChildElement = dom.nearest(this.bounds, childElements);

    var animateOptions = _.extend({}, this.snapping.animateOptions);
    var beginOptions = {};
    var completeOptions = {
      description: "snap to nearest child element",
      snapToBounds: true,
      snapToNearestChildElement: false,
      clearPositionData: true
    };

    this.animateMoveToElement(nearestChildElement, animateOptions, beginOptions, completeOptions);
  },

  /**
   * Sets a flag that indicates that the element is swiping.
   *
   * Flag is automatically cleared after a configurable timeout.
   *
   * @return {undefined}
   */
  setSwiping: function setSwiping() {
    var self = this;
    self.isSwiping = true;
    _.delay(function() {
      self.isSwiping = false;
    }, self.movement.swipingTimeout);
  },

  /**
   * Called when a movement animation is complete.
   *
   * @param options
   * @return {undefined}
   */
  onAnimationComplete: function onAnimationComplete(options) {
    var self = this;

    if (this.config.debugGestures) {
      console.log("complete: " + options.description + " " + this.element.id);
    }

    this.isPanningAny = false;
    this.isPanningX = false;
    this.isPanningY = false;

    // If waitForXAndY, two animations must complete before this method is called,
    // so decrement by 2.  Otherwise, decrement by 1.
    this.animationCount -= (options.waitForXAndY ? 2 : 1);

    _.defer(function() {
      // Snapping to nearest child gets precedence over snapping to bounds.
      // Snapping to bounds might be called after snapping to nearest child completes.
      if (options.snapToNearestChildElement) {
        self.snapToNearestChildElement();
      } else if (options.snapToBounds) {
        self.snapToBounds();
      }

      if (options.clearPositionData) {
        self.clearPositionData();
      }

      if (!options.silent) {
        if (options.event) {
          self.emit(options.event);
        }
        self.emit(DecksEvent("gesture:element:moved", self, self.element));
      }
    });
  },

  /**
   * Called when a pan gestures is started.
   *
   * @param e
   * @return {undefined}
   */
  onGesturePanStart: function onGesturePanStart(e, options) {
    options = options || {};
    var element = options.elementOverride || e.sender.element;
    if (element !== this.element) {
      return;
    }

    if (this.config.debugGestures) {
      console.log("pan start", this.element.id);
    }

    this.updatePositionData(e.data);
  },

  /**
   * Called when a pan gesture is detected in any direction.
   *
   * @param e
   * @return {undefined}
   */
  onGesturePanAny: function onGesturePanAny(e, options) {
    options = options || {};
    var element = options.elementOverride || e.sender.element;
    if (element !== this.element || this.isPanningAny || this.isSwiping) {
      return;
    }

    this.isPanningAny = true;

    if (this.config.debugGestures) {
      console.log("pan any", this.element.id);
    }

    if (this.isAnimating()) {
      this.stopAnimation();
      this.clearPositionData();
    }

    this.updatePositionData(e.data);

    var animateOptions = {};
    var beginOptions = {};
    var completeOptions = {
      description: "pan any",
      waitForXAndY: true
    };

    this.animateMoveForPan(e.data, animateOptions, beginOptions, completeOptions);
  },

  /**
   * Called when a pan gesture is detected in the horizontal direction.
   *
   * @param e
   * @return {undefined}
   */
  onGesturePanX: function onGesturePanX(e, options) {
    options = options || {};
    var element = options.elementOverride || e.sender.element;
    if (element !== this.element || this.isPanningX || this.isSwiping) {
      return;
    }

    this.isPanningX = true;

    if (this.config.debugGestures) {
      console.log("pan x", this.element.id);
    }

    if (this.isAnimating()) {
      this.stopAnimation();
      this.clearPositionData();
    }

    this.updatePositionData(e.data);

    var animateOptions = {};
    var beginOptions = {};
    var completeOptions = {
      description: "pan x",
      waitForXAndY: false
    };

    this.animateMoveForPanX(e.data, animateOptions, beginOptions, completeOptions);
  },

  /**
   * Called when a pan gesture is detected in the vertical direction.
   *
   * @param e
   * @return {undefined}
   */
  onGesturePanY: function onGesturePanY(e, options) {
    options = options || {};
    var element = options.elementOverride || e.sender.element;
    if (element !== this.element || this.isPanningY || this.isSwiping) {
      return;
    }

    this.isPanningY = true;

    if (this.config.debugGestures) {
      console.log("pan y", this.element.id);
    }

    if (this.isAnimating()) {
      this.stopAnimation();
      this.clearPositionData();
    }

    this.updatePositionData(e.data);

    var animateOptions = {};
    var beginOptions = {};
    var completeOptions = {
      description: "pan y",
      waitForXAndY: false
    };

    this.animateMoveForPanY(e.data, animateOptions, beginOptions, completeOptions);
  },

  onGesturePanEnd: function onGesturePanEnd(e, options) {
    var self = this;
    options = options || {};
    var element = options.elementOverride || e.sender.element;
    if (element !== this.element || this.isSwiping) {
      return;
    }

    // Defer the completion of the pan for one tick, because sometimes the latest animation needs to finish
    _.defer(function() {
      if (self.config.debugGestures) {
        console.log("pan end: %s (is animating: %s)", self.element.id, self.isAnimating());
      }

      if (!self.isAnimating()) {
        if (self.snapping.toNearestChildElement) {
          self.snapToNearestChildElement();
        } else if (self.snapping.toBounds) {
          self.snapToBounds();
        }

        self.clearPositionData();
      }
    });
  },

  onGesturePanCancel: function onGesturePanCancel(e, options) {
    options = options || {};
    var element = options.elementOverride || e.sender.element;
    if (element !== this.element) {
      return;
    }

    if (this.config.debugGestures) {
      console.log("pan cancel", this.element.id);
    }

    if (this.isAnimating()) {
      this.stopAnimation();
      this.clearPositionData();
    }
  },

  onGestureSwipeAny: function onGestureSwipeAny(e, options) {
    options = options || {};
    var element = options.elementOverride || e.sender.element;
    if (element !== this.element) {
      return;
    }
    this.setSwiping();
    this.stopAnimation();

    if (this.config.debugGestures) {
      console.log("swipe any", this.element.id);
    }

    var animateOptions = {};
    var beginOptions = {};
    var completeOptions = {
      description: "swipe any",
      waitForXAndY: true
    };

    this.animateMoveForSwipe(e.data, animateOptions, beginOptions, completeOptions);
  },

  onGestureSwipeX: function onGestureSwipeX(e, options) {
    options = options || {};
    var element = options.elementOverride || e.sender.element;
    if (element !== this.element) {
      return;
    }
    this.setSwiping();
    this.stopAnimation();

    if (this.config.debugGestures) {
      console.log("swipe x", this.element.id);
    }

    var animateOptions = {};
    var beginOptions = {};
    var completeOptions = {
      description: "swipe x",
      waitForXAndY: false
    };

    this.animateMoveForSwipeX(e.data, animateOptions, beginOptions, completeOptions);
  },

  onGestureSwipeY: function onGestureSwipeY(e, options) {
    options = options || {};
    var element = options.elementOverride || e.sender.element;
    if (element !== this.element) {
      return;
    }
    this.setSwiping();
    this.stopAnimation();

    if (this.config.debugGestures) {
      console.log("swipe y", this.element.id);
    }

    var animateOptions = {};
    var beginOptions = {};
    var completeOptions = {
      description: "swipe y",
      waitForXAndY: false
    };
    this.animateMoveForSwipeY(e.data, animateOptions, beginOptions, completeOptions);
  },

  onGestureTap: function onGestureTap(e, options) {
    options = options || {};
    var element = options.elementOverride || e.sender.element;
    if (element !== this.element) {
      return;
    }

    if (this.config.debugGestures) {
      console.log("tap", this.element.id);
    }

    this.stopAnimation();
    this.clearPositionData();
  },

  onGesturePress: function onGesturePress(e, options) {
    options = options || {};
    var element = options.elementOverride || e.sender.element;
    if (element !== this.element) {
      return;
    }

    if (this.config.debugGestures) {
      console.log("press", this.element.id);
    }

    this.stopAnimation();
    this.clearPositionData();
  },

  onGestureScroll: function onGestureScroll(e, options) {
    options = options || {};
    var element = options.elementOverride || e.sender.element;
    if (element !== this.containerElement) {
      return;
    }

    if (this.config.debugGestures) {
      console.log("scroll", this.containerElement);
    }

    if (this.snapping.toNearestChildElement) {
      this.snapToNearestChildElement();
    } else if (this.snapping.toBounds) {
      this.snapToBounds();
    }
  }
});

module.exports = GestureHandler;
