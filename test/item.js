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

      //item.set("key1", "val
    });
  });

});
