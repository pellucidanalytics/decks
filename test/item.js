var tools = require("./testtools");
var expect = tools.expect;
var sinon = tools.sinon;
var decks = require("..");
var Item = decks.Item;
var EventEmitter = require("eventemitter2").EventEmitter2;

describe("Item", function() {
  describe("constructor", function(){
    it("should setup sensible defaults", function() {
      var item = new Item();
      item._data.should.eql({});
    });

    it("should be an instance of EventEmitter", function() {
      var item = new Item();
      item.should.be.an.instanceof(EventEmitter);
      item.on.should.be.a('function');
      item.off.should.be.a('function');
      item.emit.should.be.a('function');
    });

    it("should set an id property, if provided in data", function() {
      var item;

      item = new Item();
      expect(item.id).to.be.a("string");
      expect(parseInt(item.id)).to.be.a("number");

      item = new Item(10);
      expect(item.id).to.eql("10");

      item = new Item("10")
      expect(item.id).to.eql("10");

      item = new Item({ id: 10 });
      expect(item.id).to.eql("10");

      item = new Item({ id: "10" });
      expect(item.id).to.eql("10");
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

      item.on("item:changed", spy);

      item.set("key1", "val2");
      spy.should.have.been.calledWith({ item: item, key: "key1", oldValue: "val1", value: "val2" });
      spy.reset();

      item.set("key1", null);
      spy.should.have.been.calledWith({ item: item, key: "key1", oldValue: "val2", value: null });
      spy.reset();

      item.set("key2", "newVal");
      spy.should.have.been.calledWith({ item: item, key: "key2", oldValue: undefined, value: "newVal" });
      spy.reset();
    });

    it("should do nothing if the value is not changing, and not using options.force = true", function() {
      var item = new Item({ key1: "val1" });
      var spy = sinon.spy();

      item.on("item:changed", spy);

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
      item.on("item:changed", spy);

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

      item.on("item:changed", spy);

      item.set("key1", "val2", { silent: true });
      spy.should.have.callCount(0);
      item.get("key1").should.eql("val2");
      spy.reset();
    });
  });

  describe("getData", function() {
    it("should return an empty object if there is no data", function() {
      var item = new Item();
      expect(item.getData()).to.eql({});
    });

    it("should return the full data object", function() {
      var data = {
        key1: "val1",
        key2: 2
      };
      var item = new Item(data);
      expect(item.getData()).to.eql(data);
    });
  });

  describe("setData", function() {
    it("should clear the object if no data is passed", function() {
      var data = {
        key: "val"
      };
      var item = new Item(data);
      var clearedSpy = sinon.spy();
      var changedSpy = sinon.spy();
      item.on("item:cleared", clearedSpy);
      item.on("item:changed", changedSpy);

      item.setData();

      expect(clearedSpy).to.have.been.called;
      expect(changedSpy).to.have.callCount(0);
    });

    it("should set the data an emit events", function() {
      var data = {
        key1: "val1",
        key2: 2
      };

      var item = new Item(data);
      expect(item.getData()).to.eql(data);

      var changedSpy = sinon.spy();
      var clearedSpy = sinon.spy();

      item.on("item:changed", changedSpy);
      item.on("item:cleared", clearedSpy);

      var data2 = {
        key3: "val3",
        key4: "val4",
        key5: "val5"
      };

      item.setData(data2);
      expect(item.getData()).to.eql(data2);
      expect(clearedSpy).to.have.been.called;
      expect(changedSpy).to.have.callCount(3);
    });

    it("should not clear the current data if options.noClear = true", function() {
      var data = {
        key1: "val1",
        key2: 2
      };

      var item = new Item(data);
      expect(item.getData()).to.eql(data);

      var data2 = {
        key2: 3,
        key3: false
      };

      var clearedSpy = sinon.spy();
      var changedSpy = sinon.spy();
      item.on("item:cleared", clearedSpy);
      item.on("item:changed", changedSpy);

      item.setData(data2, { noClear: true });
      expect(item.getData()).to.eql({
        key1: "val1",
        key2: 3,
        key3: false
      });

      expect(clearedSpy).to.have.callCount(0);
      expect(changedSpy).to.have.been.calledTwice;
    });

    it("should not emit events if options.silent = true", function() {
      var data = {
        key1: 1
      };

      var item = new Item(data);
      expect(item.getData()).to.eql(data);

      var clearedSpy = sinon.spy();
      var changedSpy = sinon.spy();
      item.on("item:cleared", clearedSpy);
      item.on("item:changed", changedSpy);

      var data2 = {
        key2: 2
      };

      item.setData(data2, { silent: true });
      expect(item.getData()).to.eql(data2);

      expect(clearedSpy).to.have.callCount(0);
      expect(changedSpy).to.have.callCount(0);
    });
  });

  describe("clear", function() {
    it("should clear the data", function() {
      var data = { key: "val" };
      var item = new Item(data);
      expect(item.getData()).to.eql(data);
      item.clear();
      expect(item.getData()).to.eql({});
    });
  });
});
