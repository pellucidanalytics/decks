var _ = require("lodash");
var tools = require("../testtools");
var expect = tools.expect;
var sinon = tools.sinon;
var decks = require("../..");
var Emitter = decks.events.Emitter;
var hasEmitter = decks.events.hasEmitter;
var binder = decks.events.binder;

describe("decks.events.hasEmitter", function() {
  function TestObject(emitter, events) {
    this.setEmitter(emitter, events);
  }

  _.extend(TestObject.prototype, hasEmitter, binder, {
    onTestEvent: function() {
    }
  });

  var emitter;
  var source;

  beforeEach(function() {
    emitter = new Emitter();
    source = new TestObject(emitter);
  });

  describe("setEmitter", function() {
    it("should set the emitter instance", function() {
      expect(source.emitter).to.equal(emitter);
    });

    it("should throw if already set", function() {
      expect(function() { source.setEmitter({}); }).to.Throw();
    });

    it("should bind to events if specified", function() {
      var events = {
        "test:event": "onTestEvent"
      };
      var bindEventsSpy = sinon.spy(TestObject.prototype, "bindEvents");
      source = new TestObject(emitter, events);
      expect(bindEventsSpy).to.have.been.calledWith(emitter, events);
      TestObject.prototype.bindEvents.restore();
    });
  });

  describe("emit", function() {
    it("should call through to emitter emit", function() {
      var emitSpy = sinon.spy(emitter, "emit");
      var data = {};
      source.emit("test:event", data);
      expect(emitSpy).to.have.been.calledWith("test:event", data);
      expect(emitSpy).to.have.been.calledOn(emitter);
      emitter.emit.restore();
    });
  });

  describe("on", function() {
    it("should call through to emitter on", function() {
      var onSpy = sinon.spy(emitter, "on");
      var fn = function() {};
      var context = {};
      source.on("test:event", fn, context);
      expect(onSpy).to.have.been.calledWith("test:event", fn, context);
      expect(onSpy).to.have.been.calledOn(emitter);
      emitter.on.restore();
    });
  });

  describe("off", function() {
    it("should call through to emitter off", function() {
      var offSpy = sinon.spy(emitter, "off");
      var fn = function() {};
      source.off("test:event", fn);
      expect(offSpy).to.have.been.calledWith("test:event", fn);
      expect(offSpy).to.have.been.calledOn(emitter);
      emitter.off.restore();
    });
  });

  describe("onAny", function() {
    it("should call through to emitter onAny", function() {
      var onAnySpy = sinon.spy(emitter, "onAny");
      var fn = function() {};
      var context = {};
      source.onAny("test:event", fn, context);
      expect(onAnySpy).to.have.been.calledWith("test:event", fn, context);
      expect(onAnySpy).to.have.been.calledOn(emitter);
      emitter.onAny.restore();
    });
  });

  describe("offAny", function() {
    it("should call through to emitter offAny", function() {
      var offAnySpy = sinon.spy(emitter, "offAny");
      var fn = function() {};
      source.offAny("test:event", fn);
      expect(offAnySpy).to.have.been.calledWith("test:event", fn);
      expect(offAnySpy).to.have.been.calledOn(emitter);
      emitter.offAny.restore();
    });
  });

  describe("once", function() {
    it("should call through to emitter once", function() {
      var onceSpy = sinon.spy(emitter, "once");
      var fn = function() {};
      var context = {};
      source.once("test:event", fn, context);
      expect(onceSpy).to.have.been.calledWith("test:event", fn, context);
      expect(onceSpy).to.have.been.calledOn(emitter);
      emitter.once.restore();
    });
  });

  describe("bindEmitterEvents", function() {
    it("should bind to emitter events if emitterEvents exists", function() {
      source.onMyEvent = function() {};
      source.emitterEvents = {
        "my:event": "onMyEvent"
      };
      var spy = sinon.spy(source, "bindEvents");
      source.bindEmitterEvents();
      expect(spy).to.have.been.calledWith(source.emitter, source.emitterEvents);
    });
  });

  describe("unbindEmitterEvents", function() {
    it("should unbind to emitter events if emitterEvents exists", function() {
      source.onMyEvent = function() {};
      source.emitterEvents = {
        "my:event": "onMyEvent"
      };
      var spy = sinon.spy(source, "unbindEvents");
      source.unbindEmitterEvents();
      expect(spy).to.have.been.calledWith(source.emitter, source.emitterEvents);
    });
  });
});
