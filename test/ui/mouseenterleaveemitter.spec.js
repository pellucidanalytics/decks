var tools = require("../testtools");
var expect = tools.expect;
var sinon = tools.sinon;
var decks = require("../..");
var MouseEnterLeaveEmitter = decks.ui.MouseEnterLeaveEmitter;
var Emitter = decks.events.Emitter;
var Hammer = require("hammerjs");
var DecksEvent = decks.events.DecksEvent;

describe("decks.ui.MouseEnterLeaveEmitter", function() {
  var emitter;
  var element;
  var hammer;
  var options;
  var mouseEnterLeaveEmitter;

  beforeEach(function() {
    emitter = new Emitter();
    element = document.createElement("div");
    hammer = new Hammer(element);
    options = {
      emitter: emitter,
      element: element,
      hammer: hammer,
      enabled: true,
      enter: true,
      leave: true
    };
    mouseEnterLeaveEmitter = new MouseEnterLeaveEmitter(options);
  });

  describe("constructor", function() {
    it("should work with new", function() {
      expect(mouseEnterLeaveEmitter).to.be.an.instanceOf(MouseEnterLeaveEmitter);
    });

    it("should work without new", function() {
      mouseEnterLeaveEmitter = MouseEnterLeaveEmitter(options);
      expect(mouseEnterLeaveEmitter).to.be.an.instanceOf(MouseEnterLeaveEmitter);
    });

    it("should set options", function() {
      expect(mouseEnterLeaveEmitter.enabled).to.be.True;
      expect(mouseEnterLeaveEmitter.enter).to.be.True;
      expect(mouseEnterLeaveEmitter.leave).to.be.True;
    });
  });

  describe("getElementEvents", function() {
    it("should get a map of mouse events", function() {
      expect(mouseEnterLeaveEmitter.getElementEvents()).to.eql({
        "mouseenter": "onMouseEnter",
        "mouseleave": "onMouseLeave"
      });
    });
  });

  describe("onMouseEnter", function() {
    it("should emit a DecksEvent", function() {
      var spy = sinon.spy();
      mouseEnterLeaveEmitter.on("gesture:mouse:enter", spy);
      var event = {};
      mouseEnterLeaveEmitter.onMouseEnter();
      expect(spy).to.have.been.calledWith(DecksEvent("gesture:mouse:enter", mouseEnterLeaveEmitter, event));
    });
  });

  describe("onMouseLeave", function() {
    it("should emit a DecksEvent", function() {
      var spy = sinon.spy();
      mouseEnterLeaveEmitter.on("gesture:mouse:leave", spy);
      var event = {};
      mouseEnterLeaveEmitter.onMouseLeave();
      expect(spy).to.have.been.calledWith(DecksEvent("gesture:mouse:leave", mouseEnterLeaveEmitter, event));
    });
  });
});
