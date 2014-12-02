var tools = require("../testtools");
var expect = tools.expect;
var sinon = tools.sinon;
var decks = require("../..");
var MouseOverOutEmitter = decks.ui.MouseOverOutEmitter;
var Emitter = decks.events.Emitter;
var Hammer = require("hammerjs");
var DecksEvent = decks.events.DecksEvent;

describe("decks.ui.MouseOverOutEmitter", function() {
  var emitter;
  var element;
  var hammer;
  var options;
  var mouseOverOutEmitter;

  beforeEach(function() {
    emitter = new Emitter();
    element = document.createElement("div");
    hammer = new Hammer(element);
    options = {
      emitter: emitter,
      element: element,
      hammer: hammer,
      enabled: true,
      over: true,
      out: true
    };
    mouseOverOutEmitter = new MouseOverOutEmitter(options);
  });

  describe("constructor", function() {
    it("should work with new", function() {
      expect(mouseOverOutEmitter).to.be.an.instanceOf(MouseOverOutEmitter);
    });

    it("should work without new", function() {
      mouseOverOutEmitter = MouseOverOutEmitter(options);
      expect(mouseOverOutEmitter).to.be.an.instanceOf(MouseOverOutEmitter);
    });

    it("should set options", function() {
      expect(mouseOverOutEmitter.enabled).to.be.True;
      expect(mouseOverOutEmitter.over).to.be.True;
      expect(mouseOverOutEmitter.out).to.be.True;
    });
  });

  describe("getElementEvents", function() {
    it("should get a map of mouse events", function() {
      expect(mouseOverOutEmitter.getElementEvents()).to.eql({
        "mouseover": "onMouseOver",
        "mouseout": "onMouseOut"
      });
    });
  });

  describe("onMouseOver", function() {
    it("should emit a DecksEvent", function() {
      var spy = sinon.spy();
      mouseOverOutEmitter.on("gesture:mouse:over", spy);
      var event = {};
      mouseOverOutEmitter.onMouseOver();
      expect(spy).to.have.been.calledWith(DecksEvent("gesture:mouse:over", mouseOverOutEmitter, event));
    });
  });

  describe("onMouseOut", function() {
    it("should emit a DecksEvent", function() {
      var spy = sinon.spy();
      mouseOverOutEmitter.on("gesture:mouse:out", spy);
      var event = {};
      mouseOverOutEmitter.onMouseOut();
      expect(spy).to.have.been.calledWith(DecksEvent("gesture:mouse:out", mouseOverOutEmitter, event));
    });
  });
});
