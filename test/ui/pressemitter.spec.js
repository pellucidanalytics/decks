var tools = require("../testtools");
var expect = tools.expect;
var sinon = tools.sinon;
var decks = require("../..");
var PressEmitter = decks.ui.PressEmitter;
var Emitter = decks.events.Emitter;
var Hammer = require("hammerjs");
var DecksEvent = decks.events.DecksEvent;

describe("decks.ui.PressEmitter", function() {
  var emitter;
  var element;
  var hammer;
  var options;
  var pressEmitter;

  beforeEach(function(){
    emitter = new Emitter();
    element = document.createElement("div");
    hammer = new Hammer(element);
    options = {
      emitter: emitter,
      element: element,
      hammer: hammer,
      enabled: true,
      threshold: 55,
      time: 22
    };
    pressEmitter = new PressEmitter(options);
  });

  describe("constructor", function() {
    it("should work with new", function( ){
      expect(pressEmitter).to.be.an.instanceOf(PressEmitter);
    });

    it("should work without new", function( ){
      pressEmitter = PressEmitter(options);
      expect(pressEmitter).to.be.an.instanceOf(PressEmitter);
    });

    it("should set options", function( ){
      expect(pressEmitter.enabled).to.be.True;
      expect(pressEmitter.threshold).to.eql(55);
      expect(pressEmitter.time).to.eql(22);
    });
  });

  describe("getHammerEvents", function() {
    it("should return a map of hammer events", function() {
      expect(pressEmitter.getHammerEvents()).to.eql({
        "press": "onPress"
      });
    });
  });

  describe("onPress", function() {
    it("should emit a DecksEvent", function() {
      var spy = sinon.spy();
      var event = {};
      pressEmitter.on("gesture:press", spy);
      pressEmitter.onPress(event);
      expect(spy).to.have.been.calledWith(DecksEvent("gesture:press", pressEmitter, event));
    });
  });
});
