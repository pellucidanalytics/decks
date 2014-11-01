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
