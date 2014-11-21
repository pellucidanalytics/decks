var _ = require("lodash");
var tools = require("./testtools");
var expect = tools.expect;
var sinon = tools.sinon;
var decks = require("..");
var Item = decks.Item;
var Emitter = decks.events.Emitter;
var DecksEvent = decks.events.DecksEvent;

describe("decks.Item", function() {
  var emitter;
  var itemOptions;
  var item;

  beforeEach(function(){
    emitter = new Emitter();
    itemOptions = {
      emitter: emitter
    };
    item = new Item(null, itemOptions);
  });

  describe("constructor", function(){
    it("should setup sensible defaults", function() {
      item.data.should.eql({});
    });

    it("should set an id property, if provided in data", function() {
      expect(item.id).to.be.a("string");
      expect(_.parseInt(item.id)).to.be.a("number");

      item = new Item(10);
      expect(item.id).to.eql("10");

      item = new Item("10");
      expect(item.id).to.eql("10");

      item = new Item({ id: 10 });
      expect(item.id).to.eql("10");

      item = new Item({ id: "10" });
      expect(item.id).to.eql("10");

      item = new Item({ _id: "10" });
      expect(item.id).to.eql("10");

      item = new Item({ Id: "10" });
      expect(item.id).to.eql("10");

      item = new Item({ ID: "10" });
      expect(item.id).to.eql("10");

      // No id specified - one should be generated
      item = new Item();
      expect(item.id).to.be.a("string");
      expect(item.id).to.have.length.above(0);
    });

    it("should set a default index value", function( ){
      item = new Item();
      expect(item.index).to.eql(-1);
    });
  });

  describe("setId", function() {
    it("should throw if already set", function() {
      item = new Item(10);
      expect(function() { item.setId(20); }).to.Throw;
    });
  });

  describe("setIndex", function() {
    it("should set the new index value", function() {
      item = new Item();
      item.setIndex(10);
      expect(item.index).to.eql(10);
      item.setIndex(20);
      expect(item.index).to.eql(20);
      item.setIndex(-1);
      expect(item.index).to.eql(-1);
    });

    it("should set s new index from an object", function() {
      item = new Item();
      item.setIndex({ index: 10 });
      expect(item.index).to.eql(10);
      item.setIndex({ index: 20 });
      expect(item.index).to.eql(20);
      item.setIndex({ index: -1 });
      expect(item.index).to.eql(-1);
    });

    it("should emit an event if the index is changed", function() {
      var spy = sinon.spy();
      item = new Item();
      item.on("item:index:changed", spy);
      item.setIndex(10);
      expect(spy).to.have.been.calledWith(DecksEvent("item:index:changed", item, 10));
    });

    it("should not emit an event if the index was not changed", function() {
      var spy = sinon.spy();
      item = new Item();
      item.setIndex(10);
      item.on("item:index:changed", spy);
      item.setIndex(10);
      expect(spy).not.to.have.been.called;
    });

    it("should return whether the index was changed", function() {
      item = new Item();
      expect(item.setIndex(10)).to.be.True;
      expect(item.setIndex(10)).to.be.False;
      expect(item.setIndex(20)).to.be.True;
      expect(item.setIndex(20)).to.be.False;
      expect(item.setIndex(-1)).to.be.True;
      expect(item.setIndex(-1)).to.be.True;
      expect(item.setIndex(10)).to.be.False;
      expect(item.setIndex(10)).to.be.False;
    });
  });

  describe("get", function() {
    it("should get data values", function() {
      item = new Item({ key1: "val1" }, itemOptions);
      expect(item.get("key1")).to.eql("val1");
      expect(item.get("key2")).to.be.Undefined;
    });
  });

  describe("set", function() {
    it("should set data values", function() {
      var item = new Item({ key1: "val1" }, itemOptions);

      expect(item.get("key1")).to.eql("val1");
      expect(item.get("key2")).to.be.Undefined;

      item.set("key1", "newVal1");
      expect(item.get("key1")).to.eql("newVal1");
      expect(item.get("key2")).to.be.Undefined;

      item.set("key2", "val2");
      expect(item.get("key1")).to.eql("newVal1");
      expect(item.get("key2")).to.eql("val2");
    });

    it("should emit changed events when setting new or changed values", function() {
      var item = new Item({ key1: "val1" }, itemOptions);
      var spy = sinon.spy();

      emitter.on("item:changed", spy);

      item.set("key1", "val2");
      spy.should.have.been.calledWith(DecksEvent("item:changed", item, { key: "key1", oldValue: "val1", value: "val2" }));
      spy.reset();

      item.set("key1", null);
      spy.should.have.been.calledWith(DecksEvent("item:changed", item, { key: "key1", oldValue: "val2", value: null }));
      spy.reset();

      item.set("key2", "newVal");
      spy.should.have.been.calledWith(DecksEvent("item:changed", item, { key: "key2", oldValue: undefined, value: "newVal" }));
      spy.reset();
    });

    it("should do nothing if the value is not changing", function() {
      var item = new Item({ key1: "val1" }, itemOptions);
      var spy = sinon.spy();

      emitter.on("item:changed", spy);

      item.set("key1", "val1");
      spy.should.have.callCount(0);
      item.get("key1").should.eql("val1");
      spy.reset();
    });
  });

  describe("getData", function() {
    it("should return an empty object if there is no data", function() {
      expect(item.getData()).to.eql({});
    });

    it("should return the full data object", function() {
      var data = {
        key1: "val1",
        key2: 2
      };
      var item = new Item(data, itemOptions);
      expect(item.getData()).to.eql(data);
    });
  });

  describe("setData", function() {
    it("should set the data and emit events", function() {
      var data = {
        key1: "val1",
        key2: 2
      };

      var item = new Item(data, itemOptions);
      expect(item.getData()).to.eql(data);

      var spy = sinon.spy();

      emitter.on("item:changed", spy);

      var data2 = {
        key3: "val3",
        key4: "val4",
        key5: "val5"
      };

      item.setData(data2);
      expect(item.getData()).to.eql(data2);
      expect(spy).to.have.been.called;
    });
  });

  describe("clear", function() {
    it("should clear the data", function() {
      var data = { key: "val" };
      var item = new Item(data, itemOptions);
      expect(item.getData()).to.eql(data);
      item.clear();
      expect(item.getData()).to.eql({});
    });
  });
});
