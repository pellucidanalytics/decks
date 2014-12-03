var _ = require("lodash");
var binder = require("../events/binder");
var hasEmitter = require("../events/hasEmitter");
var GestureHandler = require("./gesturehandler");
var validate = require("../utils/validate");

function GestureHandlerGroup(options) {
  options = _.merge({}, this.defaultOptions, options);

  this.pan = options.pan;
  this.swipe = options.swipe;

  this.gestureHandlers = [];

  this.setConfig(options.config);
  this.setEmitter(options.emitter || {}, this.emitterEvents);
  this.addGestureHandlers(options.gestureHandlers || []);
}

_.extend(GestureHandlerGroup.prototype, binder, hasEmitter, /** @lends GestureHandlerGroup.prototype */ {
  defaultOptions: {
    pan: true,
    swipe: true
  },

  emitterEvents: _.extend({}, GestureHandler.prototype.emitterEvents),

  destroy: function() {
    this.unbindEmitterEvents();
  },

  setConfig: function(config) {
    validate(config, "GestureHandlerGroup#setConfig: config", { isRequired: true, isNotSet: this.config });
    this.config = config;
  },

  hasGestureHandlerForElement: function(element) {
    return !!this.getGestureHandlerForElement(element);
  },

  getGestureHandlerForElement: function(element) {
    validate(element, "element", { isElement: true });
    return _.find(this.gestureHandlers, function(gestureHandler) {
      return gestureHandler.element === element;
    });
  },

  removeGestureHandlerForElement: function(element) {
    var gestureHandler = this.getGestureHandlerForElement(element);
    if (!gestureHandler) {
      return;
    }
    this.removeGestureHandler(gestureHandler);
  },

  hasGestureHandler: function(gestureHandler) {
    validate(gestureHandler, "gestureHandler", { isInstanceOf: GestureHandler });
    return _.contains(this.gestureHandlers, gestureHandler);
  },

  addGestureHandler: function(gestureHandler) {
    validate(gestureHandler, "gestureHandler", { isInstanceOf: GestureHandler });

    if (this.hasGestureHandler(gestureHandler)) {
      return;
    }

    this.gestureHandlers.push(gestureHandler);
  },

  addGestureHandlers: function(gestureHandlers) {
    validate(gestureHandlers, "gestureHandlers", { isArray: true });

    _.each(gestureHandlers, function(gestureHandler) {
      this.addGestureHandler(gestureHandler);
    }, this);
  },

  removeGestureHandler: function(gestureHandler) {
    validate(gestureHandler, "gestureHandler", { isInstanceOf: GestureHandler });

    if (!this.hasGestureHandler(gestureHandler)) {
      return;
    }

    _.pull(this.gestureHandlers, gestureHandler);
  },

  removeGestureHandlers: function(gestureHandlers) {
    validate(gestureHandlers, "gestureHandlers", { isArray: true });

    _.each(gestureHandlers, function(gestureHandler) {
      this.removeGestureHandler(gestureHandler);
    }, this);
  },

  applyGesture: function(options) {
    validate(options, "options", { isRequired: true });
    var enabled = options.enabled;
    var e = options.event;
    var methodName = options.methodName;

    if (!enabled) {
      return;
    }

    _.each(this.gestureHandlers, function(gestureHandler) {
      // Don't apply the gesture to the element that originally created the event
      // Don't apply the gesture to elements that aren't in this gesture handler group
      if (gestureHandler.element === e.sender.element || !this.hasGestureHandlerForElement(e.sender.element)) {
        return;
      }

      // TODO: this is not good
      e.sender.element = gestureHandler.element;

      gestureHandler[methodName](e);
    }, this);
  },

  onGesturePanStart: function(e) {
    this.applyGesture({ event: e, enabled: this.pan, methodName: "onGesturePanStart" });
  },

  onGesturePanAny: function(e) {
    this.applyGesture({ event: e, enabled: this.pan, methodName: "onGesturePanAny" });
  },

  onGesturePanX: function(e) {
    this.applyGesture({ event: e, enabled: this.pan, methodName: "onGesturePanX" });
  },

  onGesturePanY: function(e) {
    this.applyGesture({ event: e, enabled: this.pan, methodName: "onGesturePanY" });
  },

  onGesturePanEnd: function(e) {
    this.applyGesture({ event: e, enabled: this.pan, methodName: "onGesturePanEnd" });
  },

  onGesturePanCancel: function(e) {
    this.applyGesture({ event: e, enabled: this.pan, methodName: "onGesturePanCancel" });
  },

  onGestureSwipeAny: _.noop,
  onGestureSwipeX: _.noop,
  onGestureSwipeY: _.noop,
  onGestureTap: _.noop,
  onGesturePress: _.noop,
  debouncedOnGestureScroll: _.noop

  /*
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
   */

});

module.exports = GestureHandlerGroup;
