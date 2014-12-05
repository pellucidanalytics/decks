var tools = require("../testtools");
var expect = tools.expect;
var sinon = tools.sinon;
var decks = require("../..");
var GestureEmitter = decks.ui.GestureEmitter;
var Emitter = decks.events.Emitter;
var Hammer = require("hammerjs");

describe("decks.ui.GestureEmitter", function() {
  var emitter;
  var element;
  var hammer;
  var options;
  var enabled;
  var gestureEmitter;

  beforeEach(function() {
    emitter = new Emitter();
    element = document.createElement("div");
    hammer = new Hammer(element);
    enabled = true;
    options = {
      emitter: emitter,
      element: element,
      hammer: hammer,
      enabled: enabled
    };
    gestureEmitter = new GestureEmitter(options);
  });

  describe("constructor", function() {
    it("should work with new", function() {
      expect(gestureEmitter).to.be.an.instanceOf(GestureEmitter);
    });

    it("should work without new", function() {
      gestureEmitter = GestureEmitter(options);
      expect(gestureEmitter).to.be.an.instanceOf(GestureEmitter);
    });

    it("should set options", function() {
      expect(gestureEmitter.emitter).to.equal(emitter);
      expect(gestureEmitter.element).to.equal(element);
      expect(gestureEmitter.hammer).to.equal(hammer);
      expect(gestureEmitter.enabled).to.equal(enabled);
    });
  });

  describe("getElementEvents", function() {
    it("should return an empty object (base class no-op)", function() {
      expect(gestureEmitter.getElementEvents()).to.eql({});
    });
  });

  describe("bindElementEvents", function() {
    it("should get element events and bind them", function() {
      var getElementEventsSpy = sinon.spy(gestureEmitter, "getElementEvents");
      var bindEventsSpy = sinon.spy(gestureEmitter, "bindEvents");
      gestureEmitter.bindElementEvents();
      expect(getElementEventsSpy).to.have.been.calledOnce;
      expect(bindEventsSpy).to.have.been.calledOnce;
      expect(bindEventsSpy).to.have.been.calledWith(gestureEmitter.element, gestureEmitter.getElementEvents());
    });
  });

  describe("unbindElementEvents", function() {
    it("should get element events and unbind them", function() {
      var getElementEventsSpy = sinon.spy(gestureEmitter, "getElementEvents");
      var unbindEventsSpy = sinon.spy(gestureEmitter, "unbindEvents");
      gestureEmitter.unbindElementEvents();
      expect(getElementEventsSpy).to.have.been.calledOnce;
      expect(unbindEventsSpy).to.have.been.calledOnce;
      expect(unbindEventsSpy).to.have.been.calledWith(gestureEmitter.element, gestureEmitter.getElementEvents());
    });
  });

  describe("getHammerEvents", function() {
    it("should return an empty object (base class no-op)", function() {
      expect(gestureEmitter.getHammerEvents()).to.eql({});
    });
  });

  describe("bindHammerEvents", function() {
    it("should get hammer events and bind them", function() {
      var getHammerEventsSpy = sinon.spy(gestureEmitter, "getHammerEvents");
      var bindEventsSpy = sinon.spy(gestureEmitter, "bindEvents");
      gestureEmitter.bindHammerEvents();
      expect(getHammerEventsSpy).to.have.been.calledOnce;
      expect(bindEventsSpy).to.have.been.calledOnce;
      expect(bindEventsSpy).to.have.been.calledWith(gestureEmitter.hammer, gestureEmitter.getHammerEvents());
    });
  });

  describe("unbindHammerEvents", function() {
    it("should get hammer events and unbind them", function() {
      var getHammerEventsSpy = sinon.spy(gestureEmitter, "getHammerEvents");
      var unbindEventsSpy = sinon.spy(gestureEmitter, "unbindEvents");
      gestureEmitter.unbindHammerEvents();
      expect(getHammerEventsSpy).to.have.been.calledOnce;
      expect(unbindEventsSpy).to.have.been.calledOnce;
      expect(unbindEventsSpy).to.have.been.calledWith(gestureEmitter.hammer, gestureEmitter.getHammerEvents());
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
