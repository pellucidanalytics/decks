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
    if (this.movement.scroll && !_.isElement(this.movement.scrollContainerElement)) {
      throw new Error("GestureHandler#setOptions: for scroll movement, scrollContainerElement is required");
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

  updatePosition: function(e) {
    this.currentPosition = {
      event: e
    };

    // If moving by scroll, record the starting scroll top and left
    if (this.movement.scroll) {
      this.currentPosition.scrollTop = this.movement.scrollContainerElement.scrollTop;
      this.currentPosition.scrollLeft = this.movement.scrollContainerElement.scrollLeft;
    } else {
      this.currentPosition.left = dom.getStyle(this.element, "left", { parseInt: true });
      this.currentPosition.top = dom.getStyle(this.element, "top", { parseInt: true });
    }

    if (!this.startPosition) {
      this.startPosition = this.currentPosition;
    }
  },

  clearPosition: function() {
    this.startPosition = null;
    this.currentPosition = null;
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

    if (self.movement.scroll) {
      self.animator.animate(self.element, "scroll", {
        axis: "x",
        offset: self.startPosition.scrollLeft - e.deltaX,
        container: self.movement.scrollContainerElement,
        duration: 0,
        queue: false,
        complete: function() {
          self.emit("gesture:element:moved", self, self.element);
        }
      });
    } else {
      elementRect = elementRect || rect.normalize(self.element);
      var left = self.startPosition.left + e.deltaX;
      if (self.bounds && self.snapping.distanceThreshold) {
        if (elementRect.left > self.bounds.left && ((elementRect.left - self.bounds.left) > self.snapping.distanceThreshold)) {
          left = self.startPosition.left + self.snapping.distanceThreshold + ((e.deltaX - self.snapping.distanceThreshold) * self.snapping.distanceScale);
        } else if (elementRect.right < self.bounds.right && ((self.bounds.right - elementRect.right) > self.snapping.distanceThreshold)) {
          left = self.startPosition.left - self.snapping.distanceThreshold + ((e.deltaX + self.snapping.distanceThreshold) * self.snapping.distanceScale);
        }
      }
      dom.setStyle(self.element, "left", left);
      self.emit(DecksEvent("gesture:element:moved", self, self.element));
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

    if (self.movement.scroll) {
      self.animator.animate(self.element, "scroll", {
        offset: self.startPosition.scrollTop - e.deltaY,
        container: self.movement.scrollContainerElement,
        duration: 0,
        queue: false,
        complete: function() {
          self.emit("gesture:element:moved", self, self.element);
        }
      });
    } else {
      elementRect = elementRect || rect.normalize(self.element);
      var top = self.startPosition.top + e.deltaY;
      if (self.bounds && self.snapping.distanceThreshold) {
        if (elementRect.top > self.bounds.top && ((elementRect.top - self.bounds.top) > self.snapping.distanceThreshold)) {
          top = self.Starts.top + self.snapping.distanceThreshold + ((e.deltaY - self.snapping.distanceThreshold) * self.snapping.distanceScale);
        } else if (elementRect.bottom < self.bounds.bottom && ((self.bounds.bottom  - elementRect.bottom) > self.snapping.distanceThreshold)) {
          top = self.Starts.top - self.snapping.distanceThreshold + ((e.deltaY + self.snapping.distanceThreshold) * self.snapping.distanceScale);
        }
      }
      dom.setStyle(self.element, "top", top);
      self.emit(DecksEvent("gesture:element:moved", self, self.element));
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
    this.moveWithInertiaX(e);
    this.moveWithInertiaY(e);
  },

  moveWithInertiaX: function(e) {
    var self = this;

    var distance = self.getInertiaDistance(e.velocityX);
    var duration = self.getInertiaDuration(e.velocityX);
    var transform;
    var animateOptions;

    if (self.movement.scroll) {
      transform = "scroll";
      animateOptions = {
        offset: self.currentPosition.scrollLeft + distance,
        axis: "x"
      };
    } else {
      transform = {
       left: "-=" + distance
      };
    }

    animateOptions = _.extend({
      container: self.movement.scrollContainerElement,
      duration: duration,
      queue: false,
      complete: function() {
        self.isAnimating = false;
        self.snapToContainerBounds();
        self.emit(DecksEvent("gesture:element:moved", self, self.element));
      }
    }, self.inertia.animateOptions, animateOptions);

    self.isAnimating = true;
    self.emit(DecksEvent("gesture:element:moving", self, self.element));

    console.log("move inertia x: ", animateOptions);
    self.animator.animate(self.element, transform, animateOptions);
  },

  moveWithInertiaY: function(e) {
    var self = this;

    var distance = self.getInertiaDistance(e.velocityY);
    var duration = self.getInertiaDuration(e.velocityY);
    var transform;
    var animateOptions;

    console.log("start scrollTop", self.startPosition.scrollTop);
    console.log("current scrollTop", self.currentPosition.scrollTop);
    console.log("distance", distance);
    console.log("duration", duration);
    console.log("added", self.currentPosition.scrollTop + distance);
    console.log("substracted", self.currentPosition.scrollTop - distance);

    if (self.movement.scroll) {
      transform = "scroll";
      animateOptions = {
        offset: self.currentPosition.scrollTop + distance,
        container: self.movement.scrollContainerElement
      };
    } else {
      transform = {
       top: "-=" + distance
      };
    }

    animateOptions = _.extend({
      duration: duration,
      queue: false,
      complete: function() {
        self.isAnimating = false;
        self.snapToContainerBounds();
        self.emit(DecksEvent("gesture:element:moved", self, self.element));
      }
    }, self.inertia.animateOptions, animateOptions);

    self.isAnimating = true;
    self.emit(DecksEvent("gesture:element:moving", self, self.element));

    console.log("move inertia y: ", animateOptions);
    self.animator.animate(self.element, transform, animateOptions);
  },

  getInertiaDistance: function(velocity) {
    return this.inertia.distanceScale * velocity;
  },

  getInertiaDuration: function(velocity) {
    return this.inertia.durationScale * velocity;
  },

  snapToContainerBounds: function() {
    var self = this;

    // Snapping to bounds is only applicable for top/left movements (not scrolling)
    if (!self.bounds || self.movement.scroll) {
      return;
    }

    // Check if the element is 
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
    console.log("pan start");
    this.updatePosition(e.data);
  },

  onGesturePanAny: function(e) {
    console.log("pan any");
    this.updatePosition(e.data);
    this.move(e.data);
  },

  onGesturePanX: function(e) {
    console.log("pan x");
    this.updatePosition(e.data);
    this.moveX(e.data);
  },

  onGesturePanY: function(e) {
    console.log("pan y");
    this.updatePosition(e.data);
    this.moveY(e.data);
  },

  onGesturePanEnd: function(/*e*/) {
    console.log("pan end");
    if (!this.isAnimating) {
      if (this.config.debugGestures) {
        console.log("GestureHandler#onGesturePanEnd: snap to bounds");
      }
      this.snapToContainerBounds();
    }
    this.clearPosition();
  },

  onGesturePanCancel: function(/*e*/) {
    console.log("pan cancel");
    // TODO: not sure what needs to be done here, if anything
    if (this.isAnimating) {
      this.animator.animate(this.element, "stop");
      this.isAnimating = false;
    }
    this.clearPosition();
  },

  onGestureSwipeAny: function(e) {
    console.log("swipe any");
    this.moveWithInertia(e.data);
  },

  onGestureSwipeX: function(e) {
    console.log("swipe x");
    this.moveWithInertiaX(e.data);
  },

  onGestureSwipeY: function(e) {
    console.log("swipe y");
    this.moveWithInertiaY(e.data);
  },

  onGestureTap: function(/*e*/) {
  },

  onGesturePress: function(/*e*/) {
  }
});

module.exports = GestureHandler;
