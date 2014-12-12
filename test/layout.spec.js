var _ = require("lodash");
var tools = require("./testtools");
var expect = tools.expect;
var decks = require("..");
var Layout = decks.Layout;

describe("decks.Layout", function() {
  var options;
  var layout;

  beforeEach(function() {
    options = {
      getRenders: function() {},
      loadRender: function() {},
      unloadRender: function() {},
      getShowAnimation: function() {},
      getHideAnimation: function() {},
      setShowAnimation: function() {},
      setHideAnimation: function() {}
    };
    layout = new Layout(options);
  });

  describe("constructor", function() {
    it("should copy properties from options onto this, if specified", function() {
      _.each(options, function(val, key) {
        expect(layout[key]).to.eql(options[key]);
        expect(Layout.prototype[key]).not.to.eql(layout[key]);
      });
    });
  });

  describe("destroy", function() {
    it("should no-op by default", function() {
      expect(layout.destroy).to.equal(_.noop);
    });
  });

  describe("getRenders", function() {
    it("should throw a not implemented error by default", function() {
      layout = new Layout();
      expect(function() { layout.getRenders(); }).to.Throw(Error);
    });
  });

  describe("loadRender", function() {
    it("should throw a not implemented error by default", function() {
      layout = new Layout();
      expect(function() { layout.loadRender(); }).to.Throw(Error);
    });
  });

  describe("unloadRender", function() {
    it("should throw a not implemented error by default", function() {
      layout = new Layout();
      expect(function() { layout.unloadRender(); }).to.Throw(Error);
    });
  });

  describe("setHideAnimation", function() {
    xit("should set transform and animateOptions properties on the given render", function() {
      var render = {};
      layout.setHideAnimation(render);
      expect(render.transform).to.be.an("object");
      expect(render.animateOptions).to.be.an("object");
      expect(_.isEmpty(render.transform)).to.be.False;
      expect(_.isEmpty(render.animateOptions)).to.be.False;
    });
  });
});

