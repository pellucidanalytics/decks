var tools = require("../testtools");
var sinon = tools.sinon;
var expect = tools.expect;
var decks = require("../..");
var Deck = decks.Deck;
var GestureHandler = decks.ui.GestureHandler;
var GestureHandlerGroup = decks.ui.GestureHandlerGroup;
var Emitter = decks.events.Emitter;
var DecksEvent = decks.events.DecksEvent;

describe("decks.ui.GestureHandlerGroup", function() {
  var animator;
  var config;
  var emitter;
  var options;
  var gestureHandlerGroup;

  function createGestureHandler(element) {
    element = element || document.createElement("div");
    return new GestureHandler({
      animator: animator,
      config: config,
      element: element
    });
  }

  beforeEach(function() {
    animator = {
      animate: function() { }
    };
    emitter = new Emitter();
    config = Deck.prototype.defaultOptions.config;
    options = {
      config: config,
      emitter: emitter
    };
    gestureHandlerGroup = new GestureHandlerGroup(options);
  });

  describe("constructor", function() {
    it("should work with new", function() {
      expect(gestureHandlerGroup).to.be.an.instanceOf(GestureHandlerGroup);
    });

    it("should work without new", function() {
      gestureHandlerGroup = GestureHandlerGroup(options);
      expect(gestureHandlerGroup).to.be.an.instanceOf(GestureHandlerGroup);
    });

    it("should set gesture options", function() {
      expect(gestureHandlerGroup.gestures).to.eql(GestureHandlerGroup.prototype.defaultOptions.gestures);
    });

    it("should setup event handler methods for events", function() {
      expect(gestureHandlerGroup.onGesturePanStart).to.equal(gestureHandlerGroup.applyGesture);
      expect(gestureHandlerGroup.onGesturePanEnd).to.equal(gestureHandlerGroup.applyGesture);
      expect(gestureHandlerGroup.onGesturePanCancel).to.equal(gestureHandlerGroup.applyGesture);
      expect(gestureHandlerGroup.onGesturePanAny).to.be.Undefined;
      expect(gestureHandlerGroup.onGesturePanX).to.equal(gestureHandlerGroup.applyGesture);
      expect(gestureHandlerGroup.onGesturePanY).to.be.Undefined;
      expect(gestureHandlerGroup.onGestureSwipeAny).to.be.Undefined;
      expect(gestureHandlerGroup.onGestureSwipeX).to.equal(gestureHandlerGroup.applyGesture);
      expect(gestureHandlerGroup.onGestureSwipeY).to.be.Undefined;
    });

    it("should set an emitter", function() {
      expect(gestureHandlerGroup.emitter).to.equal(emitter);
    });

    it("should bind emitter events", function() {
      var spy = sinon.spy(GestureHandlerGroup.prototype, "bindEvents");
      gestureHandlerGroup = new GestureHandlerGroup(options);
      expect(spy).to.have.been.calledWith(emitter, gestureHandlerGroup.getEmitterEvents());
      GestureHandlerGroup.prototype.bindEvents.restore();
    });
  });

  describe("getEmitterEvents", function() {
    it("should get event map based on options", function() {
      gestureHandlerGroup.gestures.pan.enabled = false;
      gestureHandlerGroup.gestures.swipe.enabled = false;
      gestureHandlerGroup.gestures.tap.enabled = false;
      gestureHandlerGroup.gestures.press.enabled = false;

      expect(gestureHandlerGroup.getEmitterEvents()).to.eql({});

      gestureHandlerGroup.gestures.pan.enabled = true;
      gestureHandlerGroup.gestures.pan.horizontal = true;
      gestureHandlerGroup.gestures.pan.vertical = true;
      gestureHandlerGroup.gestures.swipe.enabled = true;
      gestureHandlerGroup.gestures.swipe.horizontal = true;
      gestureHandlerGroup.gestures.swipe.vertical = true;
      gestureHandlerGroup.gestures.tap.enabled = true;
      gestureHandlerGroup.gestures.press.enabled = true;

      expect(gestureHandlerGroup.getEmitterEvents()).to.eql({
        "gesture:pan:start": "onGesturePanStart",
        "gesture:pan:end": "onGesturePanEnd",
        "gesture:pan:cancel": "onGesturePanCancel",
        "gesture:pan:any": "onGesturePanAny",
        "gesture:swipe:any": "onGestureSwipeAny",
        "gesture:tap": "onGestureTap",
        "gesture:press": "onGesturePress"
      });
    });
  });

  describe("getEventHandlerMethodName", function() {
    it("should get a method name from an event type", function() {
      var e = DecksEvent("gesture:pan:start", {});
      expect(gestureHandlerGroup.getEventHandlerMethodName(e)).to.eql("onGesturePanStart");
    });
  });

  describe("destroy", function() {
    xit("TODO", function() {
    });
  });

  describe("setConfig", function() {
    it("should be set by the constructor", function() {
      expect(gestureHandlerGroup.config).to.eql(config);
    });

    it("should throw if already set", function() {
      expect(function() { gestureHandlerGroup.setConfig({}); }).to.Throw;
    });
  });

  describe("hasGestureHandlerForElement", function() {
    it("should return whether an element exists in a GestureHandler in the group", function() {
      var element1 = document.createElement("div");
      var element2 = document.createElement("div");
      var gestureHandler1 = createGestureHandler(element1);
      gestureHandlerGroup.addGestureHandler(gestureHandler1);
      expect(gestureHandlerGroup.hasGestureHandlerForElement(element1)).to.be.True;
      expect(gestureHandlerGroup.hasGestureHandlerForElement(element2)).to.be.False;
    });
  });

  describe("getGestureHandlerForElement", function() {
    it("should return a GestureHandler for the element", function() {
      var element = document.createElement("div");
      var gestureHandler = createGestureHandler(element);
      gestureHandlerGroup.addGestureHandler(gestureHandler);
      expect(gestureHandlerGroup.getGestureHandlerForElement(element)).to.equal(gestureHandler);
    });

    it("should return undefined if element is not in group", function() {
      var element1 = document.createElement("div");
      var element2 = document.createElement("div");
      var gestureHandler1 = createGestureHandler(element1);
      gestureHandlerGroup.addGestureHandler(gestureHandler1);
      expect(gestureHandlerGroup.getGestureHandlerForElement(element2)).to.be.Undefined;
    });
  });

  describe("removeGestureHandlerForElement", function() {
    it("should remove gesture handlers for elements", function() {
      var element1 = document.createElement("div");
      var element2 = document.createElement("div");
      var gestureHandler1 = createGestureHandler(element1);
      var gestureHandler2 = createGestureHandler(element2);
      gestureHandlerGroup.addGestureHandler(gestureHandler1);
      gestureHandlerGroup.addGestureHandler(gestureHandler2);

      gestureHandlerGroup.removeGestureHandlerForElement(element1);
      expect(gestureHandlerGroup.hasGestureHandler(gestureHandler1)).to.be.False;
      expect(gestureHandlerGroup.hasGestureHandler(gestureHandler2)).to.be.True;

      gestureHandlerGroup.removeGestureHandlerForElement(element2);
      expect(gestureHandlerGroup.hasGestureHandler(gestureHandler1)).to.be.False;
      expect(gestureHandlerGroup.hasGestureHandler(gestureHandler2)).to.be.False;
    });
  });

  describe("hasGestureHandler", function() {
    it("indicates if the group has a handler", function() {
      var gestureHandler = createGestureHandler();
      expect(gestureHandlerGroup.hasGestureHandler(gestureHandler)).to.be.False;
      gestureHandlerGroup.addGestureHandler(gestureHandler);
      expect(gestureHandlerGroup.hasGestureHandler(gestureHandler)).to.be.True;
    });
  });

  describe("addGestureHandler", function() {
    it("adds a gesture handler", function() {
      var gestureHandler = createGestureHandler();
      expect(gestureHandlerGroup.hasGestureHandler(gestureHandler)).to.be.False;
      gestureHandlerGroup.addGestureHandler(gestureHandler);
      expect(gestureHandlerGroup.hasGestureHandler(gestureHandler)).to.be.True;
    });
  });

  describe("addGestureHandlers", function() {
    it("should add multiple handlers", function() {
      var gestureHandler1 = createGestureHandler();
      var gestureHandler2 = createGestureHandler();
      gestureHandlerGroup.addGestureHandlers([gestureHandler1, gestureHandler2]);
      expect(gestureHandlerGroup.hasGestureHandler(gestureHandler1)).to.be.True;
      expect(gestureHandlerGroup.hasGestureHandler(gestureHandler2)).to.be.True;
    });
  });

  describe("removeGestureHandler", function() {
    it("should remove a handler", function() {
      var gestureHandler = createGestureHandler();
      gestureHandlerGroup.addGestureHandler(gestureHandler);
      expect(gestureHandlerGroup.hasGestureHandler(gestureHandler)).to.be.True;
      gestureHandlerGroup.removeGestureHandler(gestureHandler);
      expect(gestureHandlerGroup.hasGestureHandler(gestureHandler)).to.be.False;
    });
  });

  describe("applyGesture", function() {
    it("should call a method on every gesture handler in the group (other than the source)", function() {
      // Test elements
      var element1 = document.createElement("div");
      var element2 = document.createElement("div");
      var element3 = document.createElement("div");
      var gestureHandler1 = createGestureHandler(element1);
      var gestureHandler2 = createGestureHandler(element2);
      var gestureHandler3 = createGestureHandler(element3);
      gestureHandlerGroup.addGestureHandlers([gestureHandler1, gestureHandler2, gestureHandler3]);

      // Test event (emitted by element2)
      var e = DecksEvent("gesture:pan:start", { element: element2 }, {});

      // Gesture Handlers
      var spy1 = sinon.spy(gestureHandler1, "onGesturePanStart");
      var spy2 = sinon.spy(gestureHandler2, "onGesturePanStart");
      var spy3 = sinon.spy(gestureHandler3, "onGesturePanStart");

      gestureHandlerGroup.applyGesture(e);

      expect(spy1).to.have.been.calledWith(e, { elementOverride: element1 });
      expect(spy2).not.to.have.been.called;
      expect(spy3).to.have.been.calledWith(e, { elementOverride: element3 });

      gestureHandler1.onGesturePanStart.restore();
      gestureHandler2.onGesturePanStart.restore();
    });

    it("should not call handler methods for elements outside the group", function() {
      var element1 = document.createElement("div");
      var element2 = document.createElement("div");
      var element3 = document.createElement("div");
      var gestureHandler1 = createGestureHandler(element1);
      var gestureHandler2 = createGestureHandler(element2);
      var gestureHandler3 = createGestureHandler(element3);
      gestureHandlerGroup.addGestureHandlers([gestureHandler1, gestureHandler2]);

      // Test event (from element3)
      var e = DecksEvent("gesture:pan:start", { element: element3 }, {});

      var spy1 = sinon.spy(gestureHandler1, "onGesturePanStart");
      var spy2 = sinon.spy(gestureHandler2, "onGesturePanStart");
      var spy3 = sinon.spy(gestureHandler3, "onGesturePanStart");

      gestureHandlerGroup.applyGesture(e);

      expect(spy1).not.to.have.been.called;
      expect(spy2).not.to.have.been.called;
      expect(spy3).not.to.have.been.called;
    });
  });
});
