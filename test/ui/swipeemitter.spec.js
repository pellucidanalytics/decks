var tools = require("../testtools");
var expect = tools.expect;
var sinon = tools.sinon;
var decks = require("../..");
var SwipeEmitter = decks.ui.SwipeEmitter;
var Emitter = decks.events.Emitter;
var Hammer = require("hammerjs");
var DecksEvent = decks.events.DecksEvent;

describe("decks.ui.SwipeEmitter", function() {
  var emitter;
  var element;
  var hammer;
  var options;
  var swipeEmitter;

  beforeEach(function() {
    emitter = new Emitter();
    element = document.createElement("div");
    hammer = new Hammer(element);
    options = {
      emitter: emitter,
      element: element,
      hammer: hammer,
      enabled: true,
      horizontal: true,
      vertical: true,
      threshold: 55,
      velocity: 100
    };
    swipeEmitter = new SwipeEmitter(options);
  });

  describe("constructor", function() {
    it("should work with new", function() {
      expect(swipeEmitter).to.be.an.instanceOf(SwipeEmitter);
    });

    it("should work without new", function(){
      swipeEmitter = SwipeEmitter(options);
      expect(swipeEmitter).to.be.an.instanceOf(SwipeEmitter);
    });

    it("should set options", function() {
      expect(swipeEmitter.enabled).to.be.True;
      expect(swipeEmitter.horizontal).to.be.True;
      expect(swipeEmitter.vertical).to.be.True;
      expect(swipeEmitter.threshold).to.eql(55);
      expect(swipeEmitter.velocity).to.eql(100);
      expect(swipeEmitter.direction).to.eql(Hammer.DIRECTION_ALL);
    });
  });

  describe("defaultOptions", function() {
    it("should specify default options", function() {
      expect(swipeEmitter.defaultOptions).to.eql({
        enabled: false,
        horizontal: false,
        vertical: true,
        threshold: 0,
        velocity: 0.65
      });
    });
  });

  describe("getHammerEvents", function() {
    it("should get a map of hammer events", function() {
      expect(swipeEmitter.getHammerEvents()).to.eql({
        "swipe": "onSwipe"
      });

      swipeEmitter.horizontal = true;
      swipeEmitter.vertical = false;
      expect(swipeEmitter.getHammerEvents()).to.eql({
        "swipeleft swiperight": "onSwipeX"
      });

      swipeEmitter.horizontal = false;
      swipeEmitter.vertical = true;
      expect(swipeEmitter.getHammerEvents()).to.eql({
        "swipeup swipedown": "onSwipeY"
      });
    });
  });

  describe("onSwipe", function() {
    it("should emit a DecksEvent", function() {
      var spy = sinon.spy();
      var event = {};
      swipeEmitter.on("gesture:swipe:any", spy);
      swipeEmitter.onSwipe(event);
      expect(spy).to.have.been.calledWith(DecksEvent("gesture:swipe:any", swipeEmitter, event));
    });
  });

  describe("onSwipeX", function() {
    it("should emit a DecksEvent", function() {
      var spy = sinon.spy();
      var event = {};
      swipeEmitter.on("gesture:swipe:x", spy);
      swipeEmitter.onSwipeX(event);
      expect(spy).to.have.been.calledWith(DecksEvent("gesture:swipe:x", swipeEmitter, event));
    });
  });

  describe("onSwipeY", function() {
    it("should emit a DecksEvent", function() {
      var spy = sinon.spy();
      var event = {};
      swipeEmitter.on("gesture:swipe:y", spy);
      swipeEmitter.onSwipeY(event);
      expect(spy).to.have.been.calledWith(DecksEvent("gesture:swipe:y", swipeEmitter, event));
    });
  });
});
