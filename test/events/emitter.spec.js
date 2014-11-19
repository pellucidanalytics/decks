var tools = require("../testtools");
var expect = tools.expect;
var sinon = tools.sinon;
var decks = require("../..");
var Emitter = decks.events.Emitter;
var DecksEvent = decks.events.DecksEvent;
var EventEmitter3 = require("eventemitter3");

describe("decks.events.Emitter", function() {
  var emitter;

  beforeEach(function() {
    emitter = new Emitter();
  });

  describe("constructor", function(){
    it("should be an instance of EventEmitter3", function() {
      expect(emitter).to.be.an.instanceOf(EventEmitter3);
    });
  });

  describe("emit", function(){
    it("should handle a single DecksEvent argument", function() {
      var spy = sinon.spy();
      emitter.on("test", spy);
      var sender = {};
      var data = {};
      emitter.emit(DecksEvent("test", sender, data));
      expect(spy).to.have.been.calledWithMatch(function(value) {
        return (value instanceof DecksEvent) &&
          (value.type === "test") &&
          (value.sender === sender) &&
          (value.data === data);
      });
    });

    it("should pass-through raw event arguments to super prototype emit", function() {
      var spy = sinon.spy();
      emitter.on("test", spy);
      var sender = {};
      var data = {};
      emitter.emit("test", sender, data);
      expect(spy).to.have.been.calledWith(sender, data);
    });
  });

  describe("on", function() {
    it("should subscribe to an event with no context", function() {
      var spy = sinon.spy();

      emitter.on("test:event", spy);

      var data = {};
      emitter.emit("test:event", data);

      expect(spy).to.have.been.calledWith(data);
      expect(spy).to.have.been.calledOn(emitter); // if no context, "this" (emitter) is used
    });

    it("should subscribe to an event with a context", function() {
      var spy = sinon.spy();
      var context = {};

      emitter.on("test:event", spy, context);

      var data = {};
      emitter.emit("test:event", data);

      expect(spy).to.have.been.calledWith(data);
      expect(spy).to.have.been.calledOn(context);
    });

    it("should allow subscription with wildcard", function() {
      var spy1 = sinon.spy();
      var context1 = {};
      var spy2 = sinon.spy();
      var context2 = {};

      emitter.on("test:event", spy1, context1);
      emitter.on("*", spy2, context2);

      var data = {};
      emitter.emit("test:event", data);

      expect(spy1).to.have.been.calledWith(data);
      expect(spy1).to.have.been.calledOn(context1);

      expect(spy2).to.have.been.calledWith(data);
      expect(spy2).to.have.been.calledOn(context2);
    });

    it("should allow subscription with wildcard using DecksEvent", function() {
      var spy1 = sinon.spy();
      var context1 = {};
      var spy2 = sinon.spy();
      var context2 = {};

      emitter.on("test:event", spy1, context1);
      emitter.on("*", spy2, context2);

      var sender = {};
      var data = {};
      emitter.emit(DecksEvent("test:event", sender, data));

      expect(spy1).to.have.been.calledWithMatch(function(e) {
        return e instanceof DecksEvent &&
          e.type === "test:event" &&
          e.sender === sender &&
          e.data === data;
      });

      expect(spy1).to.have.been.calledOn(context1);

      expect(spy2).to.have.been.calledWithMatch(function(e) {
        return e instanceof DecksEvent &&
          e.type === "test:event" &&
          e.sender === sender &&
          e.data === data;
      });

      expect(spy2).to.have.been.calledOn(context2);
    });
  });

  describe("off", function() {
    it("should unsubscribe from an event with no context", function() {
      var spy = sinon.spy();
      var data = {};

      emitter.on("test:event", spy);
      emitter.emit("test:event", data);

      emitter.off("test:event", spy);
      emitter.emit("test:event", data);

      expect(spy).to.have.been.calledOnce;
      expect(spy).to.have.been.calledWith(data);
      expect(spy).to.have.been.calledOn(emitter);
    });

    it("should unsubscribe from an event with a context", function() {
      var spy = sinon.spy();
      var data = {};
      var context = {};

      emitter.on("test:event", spy, context);
      emitter.emit("test:event", data);

      emitter.off("test:event", spy, context);
      emitter.emit("test:event", data);

      expect(spy).to.have.been.calledOnce;
      expect(spy).to.have.been.calledWith(data);
      expect(spy).to.have.been.calledOn(context);
    });

    it("should unsubscribe from any event with wildcard with no context", function() {
      var spy = sinon.spy();
      var data = {};

      emitter.on("*", spy);
      emitter.emit("test:event", data);

      emitter.off("*", spy);
      emitter.emit("test:event", data);

      expect(spy).to.have.been.calledOnce;
      expect(spy).to.have.been.calledWith(data);
      expect(spy).to.have.been.calledOn(emitter);
    });

    it("should unsubscribe from any event with wildcard with context", function() {
      var spy = sinon.spy();
      var data = {};
      var context = {};

      emitter.on("*", spy, context);
      emitter.emit("test:event", data);

      emitter.off("*", spy, context);
      emitter.emit("test:event", data);

      expect(spy).to.have.been.calledOnce;
      expect(spy).to.have.been.calledWith(data);
      expect(spy).to.have.been.calledOn(context);
    });
  });

  describe("once", function() {
    it("should subscribe to an event once without context", function() {
      var spy = sinon.spy();
      var data = {};

      emitter.once("test:event", spy);

      emitter.emit("test:event", data);
      emitter.emit("test:event", data);

      expect(spy).to.have.been.calledOnce;
      expect(spy).to.have.been.calledWith(data);
      expect(spy).to.have.been.calledOn(emitter);
    });

    it("should subscribe to an event once with context", function() {
      var spy = sinon.spy();
      var data = {};
      var context = {};

      emitter.once("test:event", spy, context);

      emitter.emit("test:event", data);
      emitter.emit("test:event", data);

      expect(spy).to.have.been.calledOnce;
      expect(spy).to.have.been.calledWith(data);
      expect(spy).to.have.been.calledOn(context);
    });

    it("should subscribe to an event once with DecksEvent", function() {
      var spy = sinon.spy();
      var sender = {};
      var data = {};
      var context = {};
      var decksEvent = DecksEvent("test", sender, data);

      emitter.once("test", spy, context);

      emitter.emit(decksEvent);
      emitter.emit(decksEvent);

      expect(spy).to.have.been.calledOnce;
      expect(spy).to.have.been.calledOn(context);
      expect(spy).to.have.been.calledWithMatch(function(e) {
        return e instanceof DecksEvent &&
          e.type === "test" &&
          e.sender === sender &&
          e.data === data;
      });
    });
  });

  describe("onAny", function() {
    it("should subscribe to any event without context", function() {
      var spy = sinon.spy();
      var data1 = {};
      var data2 = {};

      emitter.onAny(spy);

      emitter.emit("test1", data1);
      emitter.emit("test2", data2);

      expect(spy).to.have.been.calledTwice;
      expect(spy).to.have.been.calledOn(emitter);
      expect(spy).to.have.been.calledWith(data1);
      expect(spy).to.have.been.calledWith(data2);
    });

    it("should subscribe to any event with context", function() {
      var spy = sinon.spy();
      var data1 = {};
      var data2 = {};
      var context = {};

      emitter.onAny(spy, context);

      emitter.emit("test1", data1);
      emitter.emit("test2", data2);

      expect(spy).to.have.been.calledTwice;
      expect(spy).to.have.been.calledOn(context);
      expect(spy).to.have.been.calledWith(data1);
      expect(spy).to.have.been.calledWith(data2);
    });

    it("should subscirbe to any event with DecksEvent", function() {
      var spy = sinon.spy();
      var data1 = {};
      var sender1 = {};
      var data2 = {};
      var sender2 = {};
      var context = {};
      var decksEvent1 = new DecksEvent("test1", sender1, data1);
      var decksEvent2 = new DecksEvent("test2", sender2, data2);

      emitter.onAny(spy, context);

      emitter.emit(decksEvent1);
      emitter.emit(decksEvent2);

      expect(spy).to.have.been.calledTwice;
      expect(spy).to.have.been.calledOn(context);
      expect(spy).to.have.been.calledWithMatch(function(e) {
        return e instanceof DecksEvent &&
          e.type === "test1" &&
          e.sender === sender1 &&
          e.data === data1;
      });
      expect(spy).to.have.been.calledWithMatch(function(e) {
        return e instanceof DecksEvent &&
          e.type === "test2" &&
          e.sender === sender2 &&
          e.data === data2;
      });
    });
  });

  describe("offAny", function() {
    it("should unsubscribe from any event with DecksEvent", function() {
      var spy = sinon.spy();
      var data1 = {};
      var sender1 = {};
      var data2 = {};
      var sender2 = {};
      var context = {};
      var decksEvent1 = new DecksEvent("test1", sender1, data1);
      var decksEvent2 = new DecksEvent("test2", sender2, data2);

      emitter.onAny(spy, context);

      emitter.emit(decksEvent1);

      emitter.offAny(spy, context);
      emitter.emit(decksEvent2);

      expect(spy).to.have.been.calledOnce;
      expect(spy).to.have.been.calledOn(context);
      expect(spy).to.have.been.calledWithMatch(function(e) {
        return e instanceof DecksEvent &&
          e.type === "test1" &&
          e.sender === sender1 &&
          e.data === data1;
      });
    });
  });
});
