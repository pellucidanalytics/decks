var _ = require("lodash");
var tools = require("../testtools");
var expect = tools.expect;
var sinon = tools.sinon;
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");
var decks = require("../..");
var eventBinder = decks.util.eventBinder;

// Test object that emits events
function TestEventSource() {
  EventEmitter.call(this);
}
inherits(TestEventSource, EventEmitter);
_.extend(TestEventSource.prototype, {
  emitTestEvent: function() {
    this.emit("test:event", { key: "val" });
  }
});

// Test object that listens to events on a source object
function TestEventTarget() {
}
_.extend(TestEventTarget.prototype, eventBinder, {
  clear: function() {
    this.onTestEventWasCalled = false;
    this.onTestEventThis = null;
    this.onTestEventArguments = null;
  }
});

describe("eventbinder", function() {
  var source;
  var target;
  var map = { "test:event": "onTestEvent" };

  beforeEach(function() {
    source = new TestEventSource();
    target = new TestEventTarget();

    target.onTestEvent = function() {
      this.onTestEventWasCalled = true;
      this.onTestEventThis = this;
      this.onTestEventArguments = arguments;
    };
  });

  describe("prototype mixin", function() {
    it("should add methods to the prototype of the target object", function() {
      expect(target.bindEvents).to.be.a("function");
      expect(target.unbindEvents).to.be.a("function");
    });
  });

  describe("bindEvents", function() {
    it("should bind to source object events", function() {
      target.bindEvents(source, map);

      source.emitTestEvent();

      expect(target.onTestEventWasCalled).to.be.true;
      expect(target.onTestEventThis).to.eql(target);
      expect(target.onTestEventArguments.length).to.eql(1);
      expect(target.onTestEventArguments[0]).to.eql({ key: "val" });
    });
  });

  describe("unbindEvents", function() {
    it("should unbind from source object events", function() {
      target.bindEvents(source, map);

      source.emitTestEvent();

      expect(target.onTestEventWasCalled).to.be.true;
      expect(target.onTestEventThis).to.eql(target);
      expect(target.onTestEventArguments.length).to.eql(1);
      expect(target.onTestEventArguments[0]).to.eql({ key: "val" });

      target.clear();
      target.unbindEvents(source, map);

      source.emitTestEvent();
      expect(target.onTestEventWasCalled).to.be.false;
      expect(target.onTestEventThis).to.be.null;
      expect(target.onTestEventArguments).to.be.null;
    });
  });
});
