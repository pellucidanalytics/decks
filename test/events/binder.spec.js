var _ = require("lodash");
var tools = require("../testtools");
var expect = tools.expect;
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
function TestEventTarget() {
}

_.extend(TestEventTarget.prototype, binder, {
  onEvent: function() {
    this.onEventWasCalled = true;
    this.onEventThis = this;
    this.onEventArguments = arguments;
  },

  clear: function() {
    this.onEventWasCalled = false;
    this.onEventThis = null;
    this.onEventArguments = null;
  }
});

describe("decks.events.binder", function() {
  var source;
  var target;
  var eventMap = {
    "event": "onEvent"
  };

  beforeEach(function() {
    source = new TestEventSource();
    target = new TestEventTarget();
  });

  afterEach(function() {
    target.clear();
  });

  describe("prototype mixin", function() {
    it("should add methods to the prototype of the target object", function() {
      expect(target.bindEvents).to.be.a("function");
      expect(target.unbindEvents).to.be.a("function");
    });
  });

  describe("bindEvents", function() {
    it("should bind to source object events with an Event argument", function() {
      target.bindEvents(source, eventMap);

      var e = DecksEvent("event", source, { key: "val" });
      source.emit(e);

      expect(target.onEventWasCalled).to.be.True;
      expect(target.onEventThis).to.eql(target);
      expect(target.onEventArguments.length).to.eql(1);
      expect(target.onEventArguments[0]).to.eql(e);
    });
  });

  describe("unbindEvents", function() {
    it("should unbind from source object events", function() {
      target.bindEvents(source, eventMap);

      source.emit(DecksEvent("event", source, { key: "val" }));
      expect(target.onEventWasCalled).to.be.True;

      target.clear();
      target.unbindEvents(source, eventMap);

      source.emit(DecksEvent("event", source, { key: "val" }));
      expect(target.onEventWasCalled).to.be.False;
    });
  });
});
