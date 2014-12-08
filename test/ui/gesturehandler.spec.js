var _ = require("lodash");
var tools = require("../testtools");
var sinon = tools.sinon;
var expect = tools.expect;
var decks = require("../..");
var Deck = decks.Deck;
var Emitter = decks.events.Emitter;
var GestureHandler = decks.ui.GestureHandler;
var dom = decks.ui.dom;
var PanEmitter = decks.ui.PanEmitter;
var SwipeEmitter = decks.ui.SwipeEmitter;
var MouseWheelEmitter = decks.ui.MouseWheelEmitter;
var MouseEnterLeaveEmitter = decks.ui.MouseEnterLeaveEmitter;
var MouseOverOutEmitter = decks.ui.MouseOverOutEmitter;
var TapEmitter = decks.ui.TapEmitter;
var PressEmitter = decks.ui.PressEmitter;
var ScrollEmitter = decks.ui.ScrollEmitter;
var Hammer = require("hammerjs");

describe("decks.ui.GestureHandler", function() {
  var containerElement;
  var element;
  var emitter;
  var animator;
  var config;
  var options;
  var gestureHandler;

  beforeEach(function() {
    containerElement = dom.create("div");
    dom.setStyles(containerElement, { position: "absolute", top: 0, left: 0, width: 800, height: 600 });
    dom.append(document.body, containerElement);

    element = dom.create("div");
    dom.setStyles(element, { position: "absolute", top: 10, left: 10, width: 20, height: 20 });
    containerElement.appendChild(element);

    emitter = new Emitter();

    animator = {
      animate: function() { }
    };

    config = Deck.prototype.defaultOptions.config;

    options = {
      emitter: emitter,
      animator: animator,
      config: config,
      element: element,
      containerElement: element
    };

    gestureHandler = new GestureHandler(options);
  });

  afterEach(function() {
    document.body.removeChild(containerElement);
  });

  describe("constructor", function() {
    it("should work with new", function() {
      expect(gestureHandler).to.be.an.instanceOf(GestureHandler);
    });

    it("should work without new", function() {
      gestureHandler = GestureHandler(options);
      expect(gestureHandler).to.be.an.instanceOf(GestureHandler);
    });

    it("should set an emitter", function() {
      expect(gestureHandler.emitter).to.eql(emitter);
    });

    it("should set an animator", function() {
      expect(gestureHandler.animator).to.eql(animator);
    });

    it("should set a config", function() {
      expect(gestureHandler.config).to.eql(config);
    });

    it("should set options", function(){
      _.keys(GestureHandler.prototype.defaultOptions, function(key) {
        expect(gestureHandler[key]).to.eql(GestureHandler.prototype.defaultOptions[key]);
      });
    });

    it("should bind to emitter events", function() {
      var spy = sinon.spy(GestureHandler.prototype, "bind");
      gestureHandler = new GestureHandler(options);
      expect(spy).to.have.been.called;
      GestureHandler.prototype.bind.restore();
    });
  });

  describe("gestureEmitterTypes", function() {
    it("should have a map of keys to constructor functions", function() {
      expect(gestureHandler.gestureEmitterTypes.pan).to.equal(PanEmitter);
      expect(gestureHandler.gestureEmitterTypes.swipe).to.equal(SwipeEmitter);
      expect(gestureHandler.gestureEmitterTypes.mouseWheel).to.equal(MouseWheelEmitter);
      expect(gestureHandler.gestureEmitterTypes.mouseEnterLeave).to.equal(MouseEnterLeaveEmitter);
      expect(gestureHandler.gestureEmitterTypes.mouseOverOut).to.equal(MouseOverOutEmitter);
      expect(gestureHandler.gestureEmitterTypes.tap).to.equal(TapEmitter);
      expect(gestureHandler.gestureEmitterTypes.press).to.equal(PressEmitter);
      expect(gestureHandler.gestureEmitterTypes.scroll).to.equal(ScrollEmitter);
    });
  });

  describe("getEmitterEvents", function() {
    it("should return a map of emitter events to bind to", function() {
      expect(gestureHandler.getEmitterEvents()).to.eql({
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
      });
    });
  });

  describe("bind", function() {
    it("should bind emitter events", function() {
      var spy = sinon.spy(gestureHandler, "bindEvents");
      gestureHandler.bind();
      expect(spy).to.have.been.calledWith(gestureHandler.emitter, gestureHandler.getEmitterEvents());
      gestureHandler.bindEvents.restore();
    });
  });

  describe("unbind", function() {
    it("should unbind emitter events", function() {
      var spy = sinon.spy(gestureHandler, "unbindEvents");
      gestureHandler.unbind();
      expect(spy).to.have.been.calledWith(gestureHandler.emitter, gestureHandler.getEmitterEvents());
      gestureHandler.unbindEvents.restore();
    });
  });

  describe("setAnimator", function() {
    it("should set an animator instance", function() {
      expect(gestureHandler.animator).to.eql(animator);
    });

    it("should throw if already set", function() {
      expect(function() { gestureHandler.setAnimator({}); }).to.Throw;
    });
  });

  describe("setConfig", function() {
    it("should set a config instance", function() {
      expect(gestureHandler.config).to.eql(config);
    });

    it("should throw if already set", function() {
      expect(function() { gestureHandler.setConfig({}); }).to.Throw;
    });
  });

  describe("setElement", function() {
    it("should set an element", function() {
      expect(gestureHandler.element).to.equal(element);
    });

    it("should set a Hammer instance", function() {
      expect(gestureHandler.hammer instanceof Hammer).to.be.True;
    });
  });

  describe("setOptions", function() {
    xit("TODO", function() {
    });
  });

  describe("setBounds", function() {
    it("should set the bounds", function() {
      var bounds1 = { top: 0, left: 0, bottom: 100, right: 100, width: 100, height: 100 };
      var bounds2 = { top: 0, left: 0, bottom: 100, right: 100, width: 100, height: 100 };
      gestureHandler.setBounds(bounds1);
      expect(gestureHandler.bounds).to.eql(bounds1);
      gestureHandler.setBounds(bounds2);
      expect(gestureHandler.bounds).to.eql(bounds2);
      gestureHandler.setBounds(bounds2);
      expect(gestureHandler.bounds).to.eql(bounds2);
    });

    it("should set the container element bounds if no bounds provided", function() {
    });
  });

  describe("destroy", function() {
    xit("TODO", function() {
    });
  });

  describe("updatePositionData", function() {
    it("should record the current position of the element", function() {
      expect(gestureHandler.currentPosition).to.be.Undefined;
      expect(gestureHandler.startPosition).to.be.Undefined;

      var e1 = { key: "val1" };
      gestureHandler.updatePositionData(e1);

      expect(gestureHandler.currentPosition).to.eql({
        event: e1,
        isNormalized: true,
        top: 10,
        bottom: 30,
        left: 10,
        right: 30,
        width: 20,
        height: 20
      });

      expect(gestureHandler.startPosition).to.eql(gestureHandler.currentPosition);

      element.style.top = "20px";
      element.style.left = "20px";

      var e2 = { key: "val2" };
      gestureHandler.updatePositionData(e2);

      expect(gestureHandler.currentPosition).to.eql({
        event: e2,
        isNormalized: true,
        top: 20,
        bottom: 40,
        left: 20,
        right: 40,
        width: 20,
        height: 20
      });

      expect(gestureHandler.startPosition).to.eql({
        event: e1,
        isNormalized: true,
        top: 10,
        bottom: 30,
        left: 10,
        right: 30,
        width: 20,
        height: 20
      });
    });
  });

  describe("clearPositionData", function() {
    it("should clear the current and start positions", function() {
      expect(gestureHandler.currentPosition).to.be.Undefined;
      expect(gestureHandler.startPosition).to.be.Undefined;

      gestureHandler.updatePositionData();
      expect(gestureHandler.currentPosition).not.to.be.Undefined;
      expect(gestureHandler.startPosition).not.to.be.Undefined;

      gestureHandler.clearPositionData();
      expect(gestureHandler.currentPosition).to.be.Null;
      expect(gestureHandler.startPosition).to.be.Null;
    });
  });

  describe("isAnimating", function() {
    it("should return true if there are animations running", function() {
      gestureHandler.animationCount = 0;
      expect(gestureHandler.isAnimating()).to.be.False;
      gestureHandler.animationCount = 1;
      expect(gestureHandler.isAnimating()).to.be.True;
      gestureHandler.animationCount = 2;
      expect(gestureHandler.isAnimating()).to.be.True;
      gestureHandler.animationCount = -1;
      expect(gestureHandler.isAnimating()).to.be.False;
    });
  });

  describe("stopAnimation", function() {
    xit("TODO", function() {
    });
  });

  describe("resetPosition", function() {
    xit("TODO", function() {
    });
  });

  describe("animateMoveForPan", function() {
    xit("TODO", function() {
    });
  });

  describe("animateMoveForPanX", function() {
    xit("TODO", function() {
    });
  });

  describe("animateMoveForPanY", function() {
    xit("TODO", function() {
    });
  });

  describe("animateMoveForSwipe", function() {
    xit("TODO", function() {
    });
  });

  describe("animateMoveForSwipeX", function() {
    xit("TODO", function() {
    });
  });

  describe("animateMoveForSwipeY", function() {
    xit("TODO", function() {
    });
  });

  describe("animateMoveX", function() {
    xit("TODO", function() {
    });
  });

  describe("animateMoveY", function() {
    xit("TODO", function() {
    });
  });

  describe("animateMoveXAndY", function() {
    xit("TODO", function() {
    });
  });

  describe("animateMoveXOrY", function() {
    xit("TODO", function() {
    });
  });

  describe("getInertiaDistance", function() {
    xit("TODO", function() {
    });
  });

  describe("getInertiaDuration", function() {
    xit("TODO", function() {
    });
  });

  describe("animateMoveToElement", function() {
    xit("TODO", function() {
    });
  });

  describe("snapToBounds", function() {
    xit("TODO", function() {
    });
  });

  describe("snapToNearestChildElement", function() {
    xit("TODO", function() {
    });
  });

  describe("onAnimationComplete", function() {
    xit("TODO", function() {
    });
  });

  describe("onGesturePanStart", function() {
    xit("TODO", function() {
    });
  });

  describe("onGesturePanAny", function() {
    xit("TODO", function() {
    });
  });

  describe("onGesturePanX", function() {
    xit("TODO", function() {
    });
  });

  describe("onGesturePanY", function() {
    xit("TODO", function() {
    });
  });

  describe("onGesturePanEnd", function() {
    xit("TODO", function() {
    });
  });

  describe("onGesturePanCancel", function() {
    xit("TODO", function() {
    });
  });

  describe("onGestureSwipeAny", function() {
    xit("TODO", function() {
    });
  });

  describe("onGestureSwipeX", function() {
    xit("TODO", function() {
    });
  });

  describe("onGestureSwipeY", function() {
    xit("TODO", function() {
    });
  });

  describe("onGestureTap", function() {
    xit("TODO", function() {
    });
  });

  describe("onGesturePress", function() {
    xit("TODO", function() {
    });
  });
});
