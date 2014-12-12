var _ = require("lodash");
var binder = require("../events/binder");
var hasEmitter = require("../events/hasemitter");
var GestureHandler = require("./gesturehandler");
var validate = require("../utils/validate");
var rect = require("../utils/rect");

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

  validate(options.containerElement, "options.containerElement", { isElement: true });

  this.gestures = options.gestures;
  this.paddingRight = options.paddingRight;
  this.paddingBottom = options.paddingBottom;
  this.gestureHandlers = [];
  this.containerElement = options.containerElement;

  this.setConfig(options.config);
  this.setEmitter(options.emitter || {});
  this.addGestureHandlers(options.gestureHandlers || []);

  this.bind();
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
      },
      tap: {
        enabled: true
      },
      press: {
        enabled: true
      }
    },
    paddingRight: 60,
    paddingBottom: 60
  },

  getEmitterEvents: function getEmitterEvents() {
    var emitterEvents = {};

    if (this.gestures.pan.enabled) {
      emitterEvents["gesture:pan:start"] = "onGesturePanStart";
      emitterEvents["gesture:pan:end"] = "onGesturePanEnd";
      emitterEvents["gesture:pan:cancel"] = "onGesturePanCancel";

      if (this.gestures.pan.horizontal && this.gestures.pan.vertical) {
        emitterEvents["gesture:pan:any"] = "onGesturePanAny";
      } else if (this.gestures.pan.vertical) {
        emitterEvents["gesture:pan:y"] = "onGesturePanY";
      } else if (this.gestures.pan.horizontal) {
        emitterEvents["gesture:pan:x"] = "onGesturePanX";
      }
    }

    if (this.gestures.swipe.enabled) {
      if (this.gestures.swipe.horizontal && this.gestures.swipe.vertical) {
        emitterEvents["gesture:swipe:any"] = "onGestureSwipeAny";
      } else if (this.gestures.swipe.vertical) {
        emitterEvents["gesture:swipe:y"] = "onGestureSwipeY";
      } else if (this.gestures.swipe.horizontal) {
        emitterEvents["gesture:swipe:x"] = "onGestureSwipeX";
      }
    }

    if (this.gestures.tap.enabled) {
      emitterEvents["gesture:tap"] = "onGestureTap";
    }

    if (this.gestures.press.enabled) {
      emitterEvents["gesture:press"] = "onGesturePress";
    }

    return emitterEvents;
  },

  bind: function bind() {
    var emitterEvents = this.getEmitterEvents();

    // Setup event handler methods for all interested events
    _.each(emitterEvents, function(methodName) {
      if (!_.isFunction(this[methodName])) {
        this[methodName] = this.applyGesture;
      }
    }, this);

    this.bindEvents(this.emitter, this.getEmitterEvents());

    _.each(this.gestureHandlers, function(gestureHandler) {
      gestureHandler.bind();
    }, this);
  },

  unbind: function unbind() {
    this.unbindEvents(this.emitter, this.getEmitterEvents());

    _.each(this.gestureHandlers, function(gestureHandler) {
      gestureHandler.unbind();
    }, this);
  },

  destroy: function destroy() {
    // Unbind from all events
    this.unbind();

    // Destroy all the gesture handlers
    _.each(this.gestureHandlers, function(gestureHandler) {
      gestureHandler.destroy();
    });

    this.gestureHandlers = [];
  },

  getEventHandlerMethodName: function getEventHandlerMethodName(e) {
    var emitterEvents = this.getEmitterEvents();
    return emitterEvents[e.type];
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

  removeGestureHandlerForElement: function removeGestureHandlerForElement(element, options) {
    var gestureHandler = this.getGestureHandlerForElement(element);

    if (!gestureHandler) {
      return;
    }

    return this.removeGestureHandler(gestureHandler, options);
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

    this.updateBounds();

    return gestureHandler;
  },

  addGestureHandlers: function addGestureHandlers(gestureHandlers) {
    validate(gestureHandlers, "gestureHandlers", { isArray: true });

    return _.map(gestureHandlers, function(gestureHandler) {
      return this.addGestureHandler(gestureHandler);
    }, this);
  },

  removeGestureHandler: function removeGestureHandler(gestureHandler, options) {
    validate(gestureHandler, "gestureHandler", { isInstanceOf: GestureHandler });
    options = options || {};

    if (!this.hasGestureHandler(gestureHandler)) {
      return;
    }

    _.pull(this.gestureHandlers, gestureHandler);

    if (options.destroy) {
      gestureHandler.destroy();
    }

    this.updateBounds();

    return gestureHandler;
  },

  applyGesture: function applyGesture(e) {
    validate(e, "GestureHandlerGroup#applyGesture: e", { isRequired: true });

    var methodName = this.getEventHandlerMethodName(e);

    _.each(this.gestureHandlers, function(gestureHandler) {
      // Don't apply the gesture to the element that originally emitted the event (it's already handled by that gesture handler)
      // Don't apply the gesture to elements that aren't in this gesture handler group
      if (gestureHandler.element === e.sender.element || !this.hasGestureHandlerForElement(e.sender.element)) {
        return;
      }

      // Allows the event to be handled by a GestureHandler that does not match the element
      // that emitted the event
      var options = {
        elementOverride: gestureHandler.element
      };

      gestureHandler[methodName](e, options);
    }, this);
  },

  /**
   * Gets all of the elements managed by this {@link GestureHandlerGroup}
   *
   * @return {Element[]}
   */
  getElements: function() {
    return _.map(this.gestureHandlers, function(gestureHandler) {
      return gestureHandler.element;
    });
  },

  /**
   * Gets the bounding client rects for all the elements in this {@link GestureHandlerGroup}
   *
   * @return {Object[]}
   */
  getElementRects: function() {
    return _.map(this.getElements(), function(element) {
      return rect.normalize(element);
    });
  },

  /**
   * Updates the bounds for all the {@link GestureHandler}s in the {@link GestureHandlerGroup}.
   *
   * @return {undefined}
   */
  updateBounds: function() {
    var elementRects = this.getElementRects();
    var containerElementBounds = rect.normalize(this.containerElement);
    var allElementBounds = rect.unionAll(elementRects);

    _.each(this.gestureHandlers, function(gestureHandler, index) {
      var elementRect = elementRects[index];

      var bounds = rect.normalize({
        left: elementRect.left - (allElementBounds.width - containerElementBounds.width) - this.paddingRight,
        right: elementRect.right,
        top: elementRect.top - (allElementBounds.height - containerElementBounds.height) - this.paddingBottom,
        bottom: elementRect.bottom
      });

      // Disallow horizontal movement if the width of all elements is less than the width of the container
      if (allElementBounds.width < containerElementBounds.width) {
        bounds.left = elementRect.left;
      }

      // Disallow vertical movement if the height of all elements is less than the height of the container
      if (allElementBounds.height < containerElementBounds.height) {
        bounds.top = elementRect.top;
      }

      /*
      console.log("------------");
      console.log("element.id", gestureHandler.element.id);
      console.log("elementRect", elementRect);
      console.log("allElementBounds.width " + allElementBounds.width);
      console.log("containerElementBounds.width", containerElementBounds.width);
      console.log("bounds", bounds);
      */

      gestureHandler.setBounds(bounds);
    }, this);
  }

});

module.exports = GestureHandlerGroup;
