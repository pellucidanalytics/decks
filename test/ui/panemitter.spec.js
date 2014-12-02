var tools = require("../testtools");
var expect = tools.expect;
var sinon = tools.sinon;
var decks = require("../..");
var PanEmitter = decks.ui.PanEmitter;
var Emitter = decks.events.Emitter;
var Hammer = require("hammerjs");
var DecksEvent = decks.events.DecksEvent;

describe("decks.ui.PanEmitter", function() {
  var emitter;
  var element;
  var hammer;
  var options;
  var panEmitter;

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
      threshold: 55
    };
    panEmitter = new PanEmitter(options);
  });

  describe("constructor", function() {
    it("should work with new", function() {
      expect(panEmitter).to.be.an.instanceOf(PanEmitter);
    });

    it("should work without new", function(){
      panEmitter = PanEmitter(options);
      expect(panEmitter).to.be.an.instanceOf(PanEmitter);
    });

    it("should set options", function() {
      expect(panEmitter.enabled).to.be.True;
      expect(panEmitter.horizontal).to.be.True;
      expect(panEmitter.vertical).to.be.True;
      expect(panEmitter.threshold).to.eql(55);
      expect(panEmitter.direction).to.eql(Hammer.DIRECTION_ALL);
    });
  });

  describe("defaultOptions", function() {
    it("should specify default options", function() {
      expect(panEmitter.defaultOptions).to.eql({
        enabled: false,
        horizontal: false,
        vertical: true,
        threshold: 0
      });
    });
  });

  describe("getHammerEvents", function() {
    it("should get a map of hammer events", function() {
      expect(panEmitter.getHammerEvents()).to.eql({
        "panstart": "onPanStart",
        "panend": "onPanEnd",
        "pancancel": "onPanCancel",
        "panmove": "onPanMove"
      });

      panEmitter.horizontal = true;
      panEmitter.vertical = false;
      expect(panEmitter.getHammerEvents()).to.eql({
        "panstart": "onPanStart",
        "panend": "onPanEnd",
        "pancancel": "onPanCancel",
        "panleft panright": "onPanX"
      });

      panEmitter.horizontal = false;
      panEmitter.vertical = true;
      expect(panEmitter.getHammerEvents()).to.eql({
        "panstart": "onPanStart",
        "panend": "onPanEnd",
        "pancancel": "onPanCancel",
        "panup pandown": "onPanY"
      });
    });
  });

  describe("onPanStart", function() {
    it("should emit a DecksEvent", function() {
      var spy = sinon.spy();
      var event = {};
      panEmitter.on("gesture:pan:start", spy);
      panEmitter.onPanStart(event);
      expect(spy).to.have.been.calledWith(DecksEvent("gesture:pan:start", panEmitter, event));
    });
  });

  describe("onPanEnd", function() {
    it("should emit a DecksEvent", function() {
      var spy = sinon.spy();
      var event = {};
      panEmitter.on("gesture:pan:end", spy);
      panEmitter.onPanEnd(event);
      expect(spy).to.have.been.calledWith(DecksEvent("gesture:pan:end", panEmitter, event));
    });
  });

  describe("onPanCancel", function() {
    it("should emit a DecksEvent", function() {
      var spy = sinon.spy();
      var event = {};
      panEmitter.on("gesture:pan:cancel", spy);
      panEmitter.onPanCancel(event);
      expect(spy).to.have.been.calledWith(DecksEvent("gesture:pan:cancel", panEmitter, event));
    });
  });

  describe("onPanMove", function() {
    it("should emit a DecksEvent", function() {
      var spy = sinon.spy();
      var event = {};
      panEmitter.on("gesture:pan:any", spy);
      panEmitter.onPanMove(event);
      expect(spy).to.have.been.calledWith(DecksEvent("gesture:pan:any", panEmitter, event));
    });
  });

  describe("onPanX", function() {
    it("should emit a DecksEvent", function() {
      var spy = sinon.spy();
      var event = {};
      panEmitter.on("gesture:pan:x", spy);
      panEmitter.onPanX(event);
      expect(spy).to.have.been.calledWith(DecksEvent("gesture:pan:x", panEmitter, event));
    });
  });

  describe("onPanY", function() {
    it("should emit a DecksEvent", function() {
      var spy = sinon.spy();
      var event = {};
      panEmitter.on("gesture:pan:y", spy);
      panEmitter.onPanY(event);
      expect(spy).to.have.been.calledWith(DecksEvent("gesture:pan:y", panEmitter, event));
    });
  });
});
