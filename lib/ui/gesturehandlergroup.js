var _ = require("lodash");
var binder = require("../events/binder");
var hasEmitter = require("../events/hasemitter");
var GestureHandler = require("./gesturehandler");
var validate = require("../utils/validate");

/**
 * Manages a group of {@link GestureHandler}s.  When some types of gesture events are emitted
 * by any {@link GestureHandler} in the group, the event will be applied to all over {@link GestureHandler}s
 * in the group.  E.g. if you pan or swipe one element 10 pixels to the left, all the other gesture handlers
 * in the group will also be instructed to pan 10 pixels to the left.
 *
 * @class
 * @param {?Object} options - options
 * @return {GestureHandlerGroup}
 */
function GestureHandlerGroup(options) {
  if (!(this instanceof GestureHandlerGroup)) {
    return new GestureHandlerGroup(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  this.gestures = options.gestures;
  this.gestureHandlers = [];

  this.setConfig(options.config);
  this.setEmitterEvents();
  this.setEmitter(options.emitter || {}, this.emitterEvents);
  this.addGestureHandlers(options.gestureHandlers || []);
}

_.extend(GestureHandlerGroup.prototype, binder, hasEmitter, /** @lends GestureHandlerGroup.prototype */ {
  defaultOptions: {
    gestures: {
      pan: {
        enabled: true,
        horizontal: true,
        vertical: false
      },
      swipe: {
        enabled: true,
        horizontal: true,
        vertical: false
      }
    }
  },

  setEmitterEvents: function setEmitterEvents() {
    this.emitterEvents = {};

    if (this.gestures.pan.enabled) {
      this.emitterEvents["gesture:pan:start"] = "onGesturePanStart";
      this.emitterEvents["gesture:pan:end"] = "onGesturePanEnd";
      this.emitterEvents["gesture:pan:cancel"] = "onGesturePanCancel";
      if (this.gestures.pan.horizontal && this.gestures.pan.vertical) {
        this.emitterEvents["gesture:pan:any"] = "onGesturePanAny";
      } else if (this.gestures.pan.vertical) {
        this.emitterEvents["gesture:pan:y"] = "onGesturePanY";
      } else if (this.gestures.pan.horizontal) {
        this.emitterEvents["gesture:pan:x"] = "onGesturePanX";
      }
    }

    if (this.gestures.swipe.enabled) {
      if (this.gestures.swipe.horizontal && this.gestures.swipe.vertical) {
        this.emitterEvents["gesture:swipe:any"] = "onGestureSwipeAny";
      } else if (this.gestures.swipe.vertical) {
        this.emitterEvents["gesture:swipe:y"] = "onGestureSwipeY";
      } else if (this.gestures.swipe.horizontal) {
        this.emitterEvents["gesture:swipe:x"] = "onGestureSwipeX";
      }
    }

    // Setup event handler methods for all interested events
    _.each(this.emitterEvents, function(methodName) {
      this[methodName] = this.applyGesture;
    }, this);
  },

  getEventHandlerMethodName: function getEventHandlerMethodName(e) {
    return this.emitterEvents[e.type];
  },

  destroy: function destroy() {
    this.unbindEmitterEvents();
  },

  setConfig: function setConfig(config) {
    validate(config, "GestureHandlerGroup#setConfig: config", { isRequired: true, isNotSet: this.config });
    this.config = config;
  },

  hasGestureHandlerForElement: function hasGestureHandlerForElement(element) {
    return !!this.getGestureHandlerForElement(element);
  },

  getGestureHandlerForElement: function getGestureHandlerForElement(element) {
    validate(element, "element", { isElement: true });
    return _.find(this.gestureHandlers, function(gestureHandler) {
      return gestureHandler.element === element;
    });
  },

  removeGestureHandlerForElement: function removeGestureHandlerForElement(element) {
    var gestureHandler = this.getGestureHandlerForElement(element);
    if (!gestureHandler) {
      return;
    }
    this.removeGestureHandler(gestureHandler);
  },

  hasGestureHandler: function hasGestureHandler(gestureHandler) {
    validate(gestureHandler, "gestureHandler", { isInstanceOf: GestureHandler });
    return _.contains(this.gestureHandlers, gestureHandler);
  },

  addGestureHandler: function addGestureHandler(gestureHandler) {
    validate(gestureHandler, "gestureHandler", { isInstanceOf: GestureHandler });
    if (this.hasGestureHandler(gestureHandler)) {
      return;
    }
    this.gestureHandlers.push(gestureHandler);
  },

  addGestureHandlers: function addGestureHandlers(gestureHandlers) {
    validate(gestureHandlers, "gestureHandlers", { isArray: true });
    _.each(gestureHandlers, function(gestureHandler) {
      this.addGestureHandler(gestureHandler);
    }, this);
  },

  removeGestureHandler: function removeGestureHandler(gestureHandler) {
    validate(gestureHandler, "gestureHandler", { isInstanceOf: GestureHandler });
    if (!this.hasGestureHandler(gestureHandler)) {
      return;
    }
    _.pull(this.gestureHandlers, gestureHandler);
  },

  removeGestureHandlers: function removeGestureHandlers(gestureHandlers) {
    validate(gestureHandlers, "gestureHandlers", { isArray: true });
    _.each(gestureHandlers, function(gestureHandler) {
      this.removeGestureHandler(gestureHandler);
    }, this);
  },

  applyGesture: function applyGesture(e) {
    validate(e, "GestureHandlerGroup#applyGesture: e", { isRequired: true });

    var methodName = this.getEventHandlerMethodName(e);

    _.each(this.gestureHandlers, function(gestureHandler) {
      // Don't apply the gesture to the element that originally created the event (it's already handled by that gesture handler)
      // Don't apply the gesture to elements that aren't in this gesture handler group
      if (gestureHandler.element === e.sender.element || !this.hasGestureHandlerForElement(e.sender.element)) {
        return;
      }

      var options = {
        elementOverride: gestureHandler.element
      };

      gestureHandler[methodName](e, options);
    }, this);
  }
});

module.exports = GestureHandlerGroup;