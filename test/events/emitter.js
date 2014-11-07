var tools = require("../testtools");
var expect = tools.expect;
var sinon = tools.sinon;
var decks = require("../..");
var Emitter = decks.events.Emitter;
var DecksEvent = decks.events.DecksEvent;
var EventEmitter3 = require("eventemitter3");

describe("decks.events.Emitter", function() {
  describe("constructor", function(){
    it("should be an instance of EventEmitter3", function() {
      var emitter = new Emitter();
      expect(emitter).to.be.an.instanceOf(EventEmitter3);
    });
  });

  describe("emit", function(){
    it("should handle a single DecksEvent argument", function() {
      var emitter = new Emitter();
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

    it("should pass-through raw event arguments to EventEmitter2.prototype.emit", function() {
      var emitter = new Emitter();
      var spy = sinon.spy();
      emitter.on("test", spy);
      var sender = {};
      var data = {};
      emitter.emit("test", sender, data);
      expect(spy).to.have.been.calledWith(sender, data);
    });
  });

  // TODO: remove these unless we add wildcards to our EventEmitter3 or our Emitter subclass
  xdescribe("wildcards", function() {
    it("should allow subscription with wildcards", function() {
      var emitter = new Emitter();

      var spy1 = sinon.spy();
      var spy2 = sinon.spy();

      emitter.on("test:event", spy1);
      emitter.on("test:*", spy2);

      var data = {};
      emitter.emit("test:event", data);

      expect(spy1).to.have.been.calledWith(data);
      expect(spy2).to.have.been.calledWith(data);
    });

    it("should allow subscription with wildcards using DecksEvent", function() {
      var emitter = new Emitter();

      var spy1 = sinon.spy();
      var spy2 = sinon.spy();

      emitter.on("test:event", spy1);
      emitter.on("test:*", spy2);

      var sender = {};
      var data = {};
      emitter.emit(DecksEvent("test:event", sender, data));

      expect(spy1).to.have.been.calledWithMatch(function(e) {
        return e instanceof DecksEvent &&
          e.type === "test:event" &&
          e.sender === sender &&
          e.data === data;
      });

      expect(spy2).to.have.been.calledWithMatch(function(e) {
        return e instanceof DecksEvent &&
          e.type === "test:event" &&
          e.sender === sender &&
          e.data === data;
      });
    });

    it("should allow wildcards for long event names", function() {
      var emitter = new Emitter();
      var spy = sinon.spy();
      emitter.on("test:**", spy);
      var data = {};
      emitter.emit("test:long:name:here", data);
      expect(spy).to.have.been.calledWith(data);
    });
  });
});
