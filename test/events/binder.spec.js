var _ = require("lodash");
var tools = require("../testtools");
var expect = tools.expect;
var sinon = tools.sinon;
var emitKeyUpEvent = tools.emitKeyUpEvent;
var decks = require("../..");
var Emitter = decks.events.Emitter;
var binder = decks.events.binder;
var DecksEvent = decks.events.DecksEvent;

// Test object that emits events
function TestEventSource() {
  Emitter.call(this);
}
TestEventSource.prototype = _.create(Emitter.prototype, {
  constructor: TestEventSource
});

// Test object that listens to events on a source object
function TestEventTarget(handler) {
  this.onTestEvent = handler;
}
_.extend(TestEventTarget.prototype, binder);

describe("decks.events.binder", function() {
  var spy;
  var source;
  var target;
  var eventMap = {
    "test:event": "onTestEvent"
  };

  beforeEach(function() {
    spy = sinon.spy();
    source = new TestEventSource();
    target = new TestEventTarget(spy);
  });

  describe("prototype mixin", function() {
    it("should add methods to the prototype of the target object", function() {
      expect(target.bindEvents).to.be.a("function");
      expect(target.unbindEvents).to.be.a("function");
    });
  });

  describe("bindEvents", function() {
    it("should bind to source object events with raw arguments", function() {
      target.bindEvents(source, eventMap);
      var data = {};

      source.emit("test:event", data);

      expect(target.onTestEvent).to.have.been.calledOnce;
      expect(target.onTestEvent).to.have.been.calledOn(target);
      expect(target.onTestEvent).to.have.been.calledWith(data);
    });

    it("should bind to source object events with an DecksEvent argument", function() {
      target.bindEvents(source, eventMap);

      var data = { key: "val" };
      var e = DecksEvent("test:event", source, data);
      source.emit(e);

      expect(target.onTestEvent).to.have.been.calledOnce;
      expect(target.onTestEvent).to.have.been.calledOn(target);
      expect(target.onTestEvent).to.have.been.calledWith(DecksEvent("test:event", source, data));
    });

    it("should bind to DOM events", function() {
      var element = document.createElement("div");
      target.onKeyUp = sinon.spy();
      target.bindEvents(element, {
        "keyup": "onKeyUp"
      });
      var event = emitKeyUpEvent(element);
      expect(target.onKeyUp).to.have.been.calledOnce;
      expect(target.onKeyUp).to.have.been.calledOn(target);
      expect(target.onKeyUp).to.have.been.calledWith(event);
    });

    it("should allow binding with a wildcard", function() {
      target.onAnyEvent = sinon.spy();
      target.onTest1 = sinon.spy();

      target.bindEvents(source, {
        "*": "onAnyEvent",
        "test1": "onTest1"
      });

      var data1 = {};
      var data2 = {};

      source.emit("test1", data1);
      source.emit("test2", data2);

      expect(target.onAnyEvent).to.have.been.calledTwice;
      expect(target.onAnyEvent).to.have.been.calledOn(target);
      expect(target.onAnyEvent).to.have.been.calledWith(data1);
      expect(target.onAnyEvent).to.have.been.calledWith(data2);

      expect(target.onTest1).to.have.been.calledOnce;
      expect(target.onTest1).to.have.been.calledOn(target);
      expect(target.onTest1).to.have.been.calledWith(data1);
    });

    it("should not use _.bind to create a copy of the method if the source is an Emitter", function() {
      target.bindEvents(source, { "test:event": "onTestEvent" });
      var boundMethodName = target.getBoundMethodName("onTestEvent");
      expect(target[boundMethodName]).to.not.be.a("function");
    });

    it("should use _.bind to create a bound copy of hte method if the source is not an Emitter", function() {
      target.onResize = function() { };
      target.bindEvents(window, { "resize": "onResize" });
      var boundMethodName = target.getBoundMethodName("onResize");
      expect(target[boundMethodName]).to.be.a("function");
    });
  });

  describe("unbindEvents", function() {
    it("should unbind from source object events", function() {
      target.bindEvents(source, eventMap);
      var data = { key: "val" };
      source.emit(DecksEvent("test:event", source, data));

      target.unbindEvents(source, eventMap);
      source.emit(DecksEvent("test:event", source, data));

      expect(target.onTestEvent).to.have.been.calledOnce;
      expect(target.onTestEvent).to.have.been.calledOn(target);
      expect(target.onTestEvent).to.have.been.calledWith(DecksEvent("test:event", source, data));
    });

    it("should unbind from DOM events", function() {
      var element = document.createElement("div");
      target.onKeyUp = sinon.spy();

      target.bindEvents(element, {
        "keyup": "onKeyUp"
      });
      var event1 = emitKeyUpEvent(element);

      target.unbindEvents(element, {
        "keyup": "onKeyUp"
      });
      emitKeyUpEvent(element);

      expect(target.onKeyUp).to.have.been.calledOnce;
      expect(target.onKeyUp).to.have.been.calledOn(target);
      expect(target.onKeyUp).to.have.been.calledWith(event1);
    });

    it("should allow unbinding with a wildcard", function() {
      target.onAnyEvent = sinon.spy();
      target.onTest1 = sinon.spy();

      target.bindEvents(source, {
        "*": "onAnyEvent",
        "test1": "onTest1"
      });

      var data1 = {};
      var data2 = {};

      source.emit("test1", data1);
      source.emit("test2", data2);

      target.unbindEvents(source, {
        "*": "onAnyEvent",
        "test1": "onTest1"
      });

      source.emit("test1", data1);
      source.emit("test2", data2);

      expect(target.onAnyEvent).to.have.been.calledTwice;
      expect(target.onAnyEvent).to.have.been.calledOn(target);
      expect(target.onAnyEvent).to.have.been.calledWith(data1);
      expect(target.onAnyEvent).to.have.been.calledWith(data2);

      expect(target.onTest1).to.have.been.calledOnce;
      expect(target.onTest1).to.have.been.calledOn(target);
      expect(target.onTest1).to.have.been.calledWith(data1);
    });
  });
});
