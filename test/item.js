var tools = require("./test-tools");
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
      item._renders.should.eql({});
    });

    it("should be an instance of EventEmitter", function() {
      var item = new Item();
      item.should.be.an.instanceof(EventEmitter);
      item.on.should.be.a('function');
      item.off.should.be.a('function');
      item.emit.should.be.a('function');
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

  describe("hasRenders", function() {
    it("should return false for no renders", function() {
      var item = new Item();
      item.hasRenders().should.be.false;
    });

    it("should return true for renders", function() {
      var item = new Item();
      item.setRender("key1", { element: "something" });
      item.setRender("key2", { element: "something" });
      item.hasRenders().should.be.true;

      item.removeRender("key2");
      item.hasRenders().should.be.true;

      item.removeRender("key1");
      item.hasRenders().should.be.false;
    });
  });

  describe("getRender", function() {
    it("should return undefined for non-existent renders", function() {
      var item = new Item();
      expect(item.getRender("key1")).to.be.undefined;
    });

    it("should return a render object for existing renders", function() {
      var item = new Item();
      var render = { element: "something", transforms: {}, animateOptions: {} };
      item.setRender("key1", render);
      item.getRender("key1").should.eql(render);
    });
  });

  describe("setRender", function() {

    it("should be able to set a new render", function() {
      var item = new Item();
      var render = { element: "something", transforms: {}, animateOptions: {} };
      var spy = sinon.spy();

      item.on("render:set", spy);

      item.setRender("key1", render);
      item.getRender("key1").should.eql(render);
      spy.should.have.been.called;
    });

    it("should remove an existing render before setting one with the same key", function() {
      var item = new Item();
      var render1 = { element: "something1", transforms: {} };
      var render2 = { element: "something2", transforms: {} };

      var renderRemovedSpy = sinon.spy();
      var renderSetSpy = sinon.spy();

      item.on("render:removed", renderRemovedSpy);
      item.on("render:set", renderSetSpy);

      item.setRender("key1", render1);
      item.getRender("key1").should.eql(render1);
      renderRemovedSpy.should.have.callCount(0);
      renderSetSpy.should.have.been.called;
      renderRemovedSpy.reset();
      renderSetSpy.reset();

      item.setRender("key1", render2);
      item.getRender("key1").should.eql(render2);
      renderRemovedSpy.should.have.been.calledWith({ key: "key1", render: render1 });
      renderSetSpy.should.have.been.calledWith({ key: "key1", render: render2 });
      renderRemovedSpy.reset();
      renderSetSpy.reset();
    });

    it("should do nothing if setting the same render for a key", function() {
      var item = new Item();
      var render1 = { element: "something1", transforms: {} };

      var renderRemovedSpy = sinon.spy();
      var renderSetSpy = sinon.spy();

      item.on("render:removed", renderRemovedSpy);
      item.on("render:set", renderSetSpy);

      item.setRender("key1", render1);
      item.getRender("key1").should.eql(render1);
      renderRemovedSpy.should.have.callCount(0);
      renderSetSpy.should.have.been.called;
      renderRemovedSpy.reset();
      renderSetSpy.reset();

      item.setRender("key1", render1);
      item.getRender("key1").should.eql(render1);
      renderRemovedSpy.should.have.callCount(0);
      renderSetSpy.should.have.callCount(0);
      renderRemovedSpy.reset();
      renderSetSpy.reset();
    });

    it("should force a set if setting the same render and options.force = true", function() {
      var item = new Item();
      var render1 = { element: "something1", transforms: {} };
      var renderRemovedSpy = sinon.spy();
      var renderSetSpy = sinon.spy();

      item.on("render:removed", renderRemovedSpy);
      item.on("render:set", renderSetSpy);

      item.setRender("key1", render1);
      item.getRender("key1").should.eql(render1);
      renderRemovedSpy.should.have.callCount(0);
      renderSetSpy.should.have.been.called;
      renderRemovedSpy.reset();
      renderSetSpy.reset();

      item.setRender("key1", render1, { force: true });
      item.getRender("key1").should.eql(render1);
      renderRemovedSpy.should.have.been.calledWith({ key: "key1", render: render1 });
      renderSetSpy.should.have.been.calledWith({ key: "key1", render: render1 });
      renderRemovedSpy.reset();
      renderSetSpy.reset();
    });

    it("should not emit events with options.silent = true", function() {
      var item = new Item();
      var render1 = { element: "something1", transforms: {} };
      var renderRemovedSpy = sinon.spy();
      var renderSetSpy = sinon.spy();

      item.on("render:removed", renderRemovedSpy);
      item.on("render:set", renderSetSpy);

      item.setRender("key1", render1, { silent: true });
      item.getRender("key1").should.eql(render1);
      renderRemovedSpy.should.have.callCount(0);
      renderSetSpy.should.have.callCount(0);

      item.setRender("key1", render1, { force: true, silent: true });
      item.getRender("key1").should.eql(render1);
      renderRemovedSpy.should.have.callCount(0);
      renderSetSpy.should.have.callCount(0);
    });
  });

  describe("setRenders", function() {
    it("should set the new renders on the item", function() {
      var item = new Item();
      var renders = {
        "key1": {
          element: "el1"
        },
        "key2": {
          element: "el2"
        }
      };

      item.setRenders(renders);
      item.getRender("key1").should.eql(renders.key1);
      item.getRender("key2").should.eql(renders.key2);
    });

    it("should clear current renders by default, before setting new ones", function() {
      var item = new Item();
      var renders1 = {
        "key1": {
          element: "el1"
        },
        "key2": {
          element: "el2"
        }
      };

      var renders2 = {
        "key3": {
          element: "el3"
        },
        "key4": {
          element: "el4"
        }
      };

      item.setRenders(renders1);
      expect(item.getRender("key1")).to.eql(renders1.key1);
      expect(item.getRender("key2")).to.eql(renders1.key2);
      expect(item.getRender("key3")).to.be.undefined;
      expect(item.getRender("key4")).to.be.undefined;

      item.setRenders(renders2);
      expect(item.getRender("key1")).to.be.undefined;
      expect(item.getRender("key2")).to.be.undefined;
      expect(item.getRender("key3")).to.eql(renders2.key3);
      expect(item.getRender("key4")).to.eql(renders2.key4);
    });

    it("should emit events when setting renders", function() {
      var item = new Item();

      var renders1 = {
        "key1": {
          element: "el1"
        },
        "key2": {
          element: "el2"
        }
      };

      var renders2 = {
        "key3": {
          element: "el3"
        },
        "key4": {
          element: "el4"
        }
      };

      var renderSetSpy = sinon.spy();
      var renderRemovedSpy = sinon.spy();
      var rendersClearedSpy = sinon.spy();
      var rendersSetSpy = sinon.spy();

      item.on("render:set", renderSetSpy);
      item.on("render:removed", renderRemovedSpy);
      item.on("renders:cleared", rendersClearedSpy);
      item.on("renders:set", rendersSetSpy);

      item.setRenders(renders1);
      renderSetSpy.should.have.been.calledTwice;
      renderRemovedSpy.should.have.callCount(0);
      rendersClearedSpy.should.have.callCount(0);
      rendersSetSpy.should.have.been.called;
      renderSetSpy.reset();
      renderRemovedSpy.reset();
      rendersClearedSpy.reset();
      rendersSetSpy.reset();

      item.setRenders(renders2);
      renderSetSpy.should.have.been.calledTwice;
      renderRemovedSpy.should.have.been.calledTwice;
      rendersClearedSpy.should.have.been.called;
      rendersSetSpy.should.have.been.called;
      renderSetSpy.reset();
      renderRemovedSpy.reset();
      rendersClearedSpy.reset();
      rendersSetSpy.reset();
    });
  });

  describe("removeRender", function() {
    it("should do nothing if render does not exist", function() {
      var item = new Item();
      var spy = sinon.spy();
      item.on("render:removed", spy);
      item.removeRender("key1");
      item.removeRender("key2");
      spy.should.have.callCount(0);
    });

    it("should remove an existing render, and emit an event", function() {
      var item = new Item();
      var render = {
        element: "something"
      };
      var spy = sinon.spy();

      item.on("render:removed", spy);

      item.setRender("key1", render);
      item.hasRender("key1").should.be.true;
      item.removeRender("key1");
      item.hasRender("key1").should.be.false;
      spy.should.have.been.calledWith({ key: "key1", render: render });
    });

    it("should not emit an event when options.silent = true", function() {
      var item = new Item();
      var render = {
        element: "something"
      };
      var spy = sinon.spy();

      item.on("render:removed", spy);

      item.setRender("key1", render);
      item.hasRender("key1").should.be.true;
      item.removeRender("key1", { silent: true });
      item.hasRender("key1").should.be.false;
      spy.should.have.callCount(0);
    });
  });

  describe("clearRenders", function() {
    it("should do nothing if there are no renders", function() {
      var item = new Item();

      var renderRemovedSpy = sinon.spy();
      var rendersClearedSpy = sinon.spy();

      item.on("render:removed", renderRemovedSpy);
      item.on("renders:cleared", rendersClearedSpy);

      item.clearRenders();

      renderRemovedSpy.should.have.callCount(0);
      rendersClearedSpy.should.have.callCount(0);
    });

    it("should emit events when clearing items", function() {
      var item = new Item();
      var renders = {
        key1: {
          element: "something1"
        },
        key2: {
          element: "something2"
        }
      };

      var renderRemovedSpy = sinon.spy();
      var rendersClearedSpy = sinon.spy();

      item.on("render:removed", renderRemovedSpy);
      item.on("renders:cleared", rendersClearedSpy);

      item.setRenders(renders);
      item.clearRenders();

      renderRemovedSpy.should.have.been.calledWith({ key: "key1", render: renders.key1 });
      renderRemovedSpy.should.have.been.calledWith({ key: "key2", render: renders.key2 });
      rendersClearedSpy.should.have.been.called;
    });
  });
});
