var tools = require("./test-tools");
var expect = tools.expect;
var sinon = tools.sinon;
var decks = require("..");
var Item = decks.Item;
var EventEmitter = require("events").EventEmitter;

describe("item", function() {
  describe("constructor", function(){
    it("should setup sensible defaults", function() {
      var item = new Item();
      item._data.should.eql({});
      item._renders.should.eql({});
    });

    it("should be an instance of EventEmitter", function() {
      var item = new Item();
      item.should.be.an.instanceof(EventEmitter);
      item._events.should.eql({}); // make sure EventEmitter super ctor is called
    });
  });

  describe("get", function() {
    it("should get data values", function() {
      var item = new Item({ key1: "val1" });
      expect(item.get("key1")).to.eql("val1");
      expect(item.get("key2")).to.be.undefined;
    });
  });

  describe("set", function() {
    it("should set data values", function() {
      var item = new Item({ key1: "val1" });

      expect(item.get("key1")).to.eql("val1");
      expect(item.get("key2")).to.be.undefined;

      item.set("key1", "newVal1");
      expect(item.get("key1")).to.eql("newVal1");
      expect(item.get("key2")).to.be.undefined;

      item.set("key2", "val2");
      expect(item.get("key1")).to.eql("newVal1");
      expect(item.get("key2")).to.eql("val2");
    });

    it("should emit changed events when setting new or changed values", function() {
      var item = new Item({ key1: "val1" });
      var spy = sinon.spy();

      item.on("changed", spy);

      item.set("key1", "val2");
      spy.should.have.been.calledWith({ key: "key1", oldValue: "val1", newValue: "val2" });
      spy.reset();

      item.set("key1", null);
      spy.should.have.been.calledWith({ key: "key1", oldValue: "val2", newValue: null });
      spy.reset();

      item.set("key2", "newVal");
      spy.should.have.been.calledWith({ key: "key2", oldValue: undefined, newValue: "newVal" });
      spy.reset();
    });

    it("should do nothing if the value is not changing, and not using options.force = true", function() {
      var item = new Item({ key1: "val1" });
      var spy = sinon.spy();

      item.on("changed", spy);

      item.set("key1", "val1");
      spy.should.have.callCount(0);
      item.get("key1").should.eql("val1");
      spy.reset();

      item.set("key1", "val1", { silent: true });
      spy.should.have.callCount(0);
      item.get("key1").should.eql("val1");
      spy.reset();
    });

    it("should force the set if using options.force = true", function() {
      var item = new Item({ key1: "val1" });
      var spy = sinon.spy();
      item.on("changed", spy);

      item.set("key1", "val1", { force: true, silent: false });
      spy.should.have.been.called;
      item.get("key1").should.eql("val1");
      spy.reset();

      item.set("key1", "val1", { force: true, silent: true }); // Not really a useful way to call .set
      spy.should.have.callCount(0);
      item.get("key1").should.eql("val1");
      spy.reset();
    });

    it("should not emit events for options.silent = true", function() {
      var item = new Item({ key1: "val1" });
      var spy = sinon.spy();

      item.on("changed", spy);

      item.set("key1", "val2", { silent: true });
      spy.should.have.callCount(0);
      item.get("key1").should.eql("val2");
      spy.reset();
    });
  });

  describe("hasRender", function() {
    it("should return false for non-existent renders", function() {
      var item = new Item();
      item.hasRender().should.be.false;
      item.hasRender(null).should.be.false;
      item.hasRender(undefined).should.be.false;
      item.hasRender("key1").should.be.false;
    });

    it("should return true for existing renders", function() {
      var item = new Item();
      item.setRender("key1", { element: "something", transform: "something" });
      item.hasRender("key1").should.be.true;
    });
  });

  describe("getRender", function() {
    it("should return undefined for non-existent renders", function() {
      var item = new Item();

      expect(item.getRender("key1")).to.be.undefined;
    });
  });

});
