var _ = require("lodash");
var tools = require("./testtools");
var expect = tools.expect;
var decks = require("..");
var Layout = decks.Layout;

describe("decks.Layout", function() {
  describe("constructor", function() {
    it("should copy properties from options onto this, if specified", function() {
      var options = {
        getRenders: function() {},
        loadRender: function() {},
        unloadRender: function() {},
        getShowAnimation: function() {},
        getHideAnimation: function() {},
        setShowAnimation: function() {},
        setHideAnimation: function() {}
      };

      var layout = new Layout(options);

      _.each(options, function(val, key) {
        expect(layout[key]).to.eql(options[key]);
        expect(Layout.prototype[key]).not.to.eql(layout[key]);
      });
    });
  });

  describe("getRenders", function() {
    it("should throw a not implemented error by default", function() {
      var layout = new Layout();
      expect(function() { layout.getRenders(); }).to.throw(Error);
    });
  });

  describe("loadRender", function() {
    it("should throw a not implemented error by default", function() {
      var layout = new Layout();
      expect(function() { layout.loadRender(); }).to.throw(Error);
    });
  });

  describe("unloadRender", function() {
    it("should throw a not implemented error by default", function() {
      var layout = new Layout();
      expect(function() { layout.unloadRender(); }).to.throw(Error);
    });
  });

  describe("setHideAnimation", function() {
    it("should set transform and animateOptions properties on the given render", function() {
      var layout = new Layout();
      var render = {};

      layout.setHideAnimation(render);
      expect(render.transform).to.be.an("object");
      expect(render.animateOptions).to.be.an("object");
      expect(_.isEmpty(render.transform)).to.be.false;
      expect(_.isEmpty(render.animateOptions)).to.be.false;
    });
  });
});

