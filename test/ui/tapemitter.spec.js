var tools = require("../testtools");
var expect = tools.expect;
var sinon = tools.sinon;
var decks = require("../..");
var TapEmitter = decks.ui.TapEmitter;
var Emitter = decks.events.Emitter;
var Hammer = require("hammerjs");
var DecksEvent = decks.events.DecksEvent;

describe("decks.ui.TapEmitter", function() {
  var emitter;
  var element;
  var hammer;
  var options;
  var tapEmitter;

  beforeEach(function(){
    emitter = new Emitter();
    element = document.createElement("div");
    hammer = new Hammer(element);
    options = {
      emitter: emitter,
      element: element,
      hammer: hammer,
      enabled: true,
      taps: 2,
      interval: 400,
      time: 22,
      threshold: 55,
      posThreshold: 423
    };
    tapEmitter = new TapEmitter(options);
  });

  describe("constructor", function() {
    it("should work with new", function( ){
      expect(tapEmitter).to.be.an.instanceOf(TapEmitter);
    });

    it("should work without new", function( ){
      tapEmitter = TapEmitter(options);
      expect(tapEmitter).to.be.an.instanceOf(TapEmitter);
    });

    it("should set options", function( ){
      expect(tapEmitter.enabled).to.be.True;
      expect(tapEmitter.taps).to.eql(2);
      expect(tapEmitter.interval).to.eql(400);
      expect(tapEmitter.time).to.eql(22);
      expect(tapEmitter.threshold).to.eql(55);
      expect(tapEmitter.posThreshold).to.eql(423);
    });
  });

  describe("getHammerEvents", function() {
    it("should return a map of hammer events", function() {
      expect(tapEmitter.getHammerEvents()).to.eql({
        "tap": "onTap"
      });
    });
  });

  describe("onTap", function() {
    it("should emit a DecksEvent", function() {
      var spy = sinon.spy();
      var event = {};
      tapEmitter.on("gesture:tap", spy);
      tapEmitter.onTap(event);
      expect(spy).to.have.been.calledWith(DecksEvent("gesture:tap", tapEmitter, event));
    });
  });
});
