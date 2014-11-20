var tools = require("../testtools");
var expect = tools.expect;
var sinon = tools.sinon;
var decks = require("../..");
var GestureEmitter = decks.ui.GestureEmitter;
var Hammer = require("hammerjs");

describe("decks.ui.GestureEmitter", function() {
  var element;
  var hammer;
  var options;
  var gestureEmitter;

  beforeEach(function() {
    element = document.createElement("div");
    hammer = new Hammer(element);
    options = {
      hammer: hammer
    };
    gestureEmitter = new GestureEmitter(element, options);
  });

  describe("constructor", function() {
    it("should work with new", function() {
      expect(gestureEmitter).to.be.an.instanceOf(GestureEmitter);
    });

    it("should work without new", function() {
      gestureEmitter = GestureEmitter(element, options);
      expect(gestureEmitter).to.be.an.instanceOf(GestureEmitter);
    });
  });

  describe("getElementEvents", function() {
    it("should return an empty object (base class no-op)", function() {
      expect(gestureEmitter.getElementEvents()).to.eql({});
    });
  });

  describe("bindElementEvents", function() {
    it("should get element events, but not bind them (because there are none)", function() {
      var getElementEventsSpy = sinon.spy(gestureEmitter, "getElementEvents");
      var bindEventsSpy = sinon.spy(gestureEmitter, "bindEvents");
      gestureEmitter.bindElementEvents();
      expect(getElementEventsSpy).to.have.been.calledOnce;
      expect(bindEventsSpy).not.to.have.been.calledOnce;
    });
  });

  describe("unbindElementEvents", function() {
    it("should get element events, but not unbind them (because there are none)", function() {
      var getElementEventsSpy = sinon.spy(gestureEmitter, "getElementEvents");
      var unbindEventsSpy = sinon.spy(gestureEmitter, "unbindEvents");
      gestureEmitter.unbindElementEvents();
      expect(getElementEventsSpy).to.have.been.calledOnce;
      expect(unbindEventsSpy).not.to.have.been.calledOnce;
    });
  });

  describe("getHammerEvents", function() {
    it("should return an empty object (base class no-op)", function() {
      expect(gestureEmitter.getHammerEvents()).to.eql({});
    });
  });

  describe("bindHammerEvents", function() {
    it("should get hammer events, but not bind them (because there are none)", function() {
      var getHammerEventsSpy = sinon.spy(gestureEmitter, "getHammerEvents");
      var bindEventsSpy = sinon.spy(gestureEmitter, "bindEvents");
      gestureEmitter.bindHammerEvents();
      expect(getHammerEventsSpy).to.have.been.calledOnce;
      expect(bindEventsSpy).not.to.have.been.calledOnce;
    });
  });

  describe("unbindHammerEvents", function() {
    it("should get hammer events, but not unbind them (because there are none)", function() {
      var getHammerEventsSpy = sinon.spy(gestureEmitter, "getHammerEvents");
      var unbindEventsSpy = sinon.spy(gestureEmitter, "unbindEvents");
      gestureEmitter.unbindHammerEvents();
      expect(getHammerEventsSpy).to.have.been.calledOnce;
      expect(unbindEventsSpy).not.to.have.been.calledOnce;
    });
  });

  describe("destroy", function() {
    it("should unbind element and hammer events", function() {
      var unbindElementEventsSpy = sinon.spy(gestureEmitter, "unbindElementEvents");
      var unbindHammerEventsSpy = sinon.spy(gestureEmitter, "unbindHammerEvents");

      gestureEmitter.destroy();

      expect(unbindElementEventsSpy).to.have.been.calledOnce;
      expect(unbindHammerEventsSpy).to.have.been.calledOnce;
    });
  });
});
