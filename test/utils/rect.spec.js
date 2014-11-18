var tools = require("../testtools");
var expect = tools.expect;
var decks = require("../..");
var rect = decks.utils.rect;

describe("decks.utils.rect", function() {
  describe("normalize", function(){
    it("should calculate rectangle width and height if not specified", function() {
      var input = { top: 10, bottom: 90, left: 20, right: 120 };
      var expected = { isNormalized: true, top: 10, bottom: 90, left: 20, right: 120, width: 100, height: 80 };
      expect(rect.normalize(input)).to.eql(expected);
    });
  });

  describe("intersects", function() {
    it("should return true for intersecting rectangles", function() {
      var r1 = { top: 10, bottom: 90, left: 20, right: 120 };
      var r2 = { top: 20, bottom: 100, left: 30, right: 130 };
      expect(rect.intersects(r1, r2)).to.be.True;
    });

    it("should return false for non-intersecting rectangles", function(){
      var r1 = { top: 10, bottom: 20, left: 10, right: 20 };
      var r2 = { top: 100, bottom: 110, left: 100, right: 110 };
      expect(rect.intersects(r1, r2)).to.be.False;
    });
  });

  describe("union", function() {
    it("should create a union of intersecting rectangles", function() {
      var r1 = { top: 10, bottom: 90, left: 20, right: 120 };
      var r2 = { top: 20, bottom: 100, left: 30, right: 130 };
      var expected = { isNormalized: true, top: 10, bottom: 100, left: 20, right: 130, width: 110, height: 90 };
      expect(rect.union(r1, r2)).to.eql(expected);
    });

    it("should create a union of non-intersecting rectangles", function() {
      var r1 = { top: 10, bottom: 20, left: 10, right: 20 };
      var r2 = { top: 100, bottom: 110, left: 100, right: 110 };
      var expected = { isNormalized: true, top: 10, bottom: 110, left: 10, right: 110, width: 100, height: 100 };
      expect(rect.union(r1, r2)).to.eql(expected);
    });
  });

  describe("unionAll", function() {
    it("should a create a union of several rectangles", function() {
      var rects = [
        { top: 10, bottom: 20, left: 10, right: 20 },
        { top: 0, bottom: 100, left: 0, right: 5 },
        { top: -20, bottom: 40, left: 50, right: 200 }
      ];
      var expected = { isNormalized: true, top: -20, bottom: 100, left: 0, right: 200, width: 200, height: 120 };
      expect(rect.unionAll(rects)).to.eql(expected);
    });
  });

  describe("resize", function() {
    it("should modify right, bottom, width and height", function() {
      var input = { top: 10, bottom: 90, left: 10, right: 110, width: 100, height: 80 };
      var expected = { isNormalized: true, top: 10, bottom: 30, left: 10, right: 60, width: 50, height: 20 };
      expect(rect.resize(input, 50, 20)).to.eql(expected);
    });
  });

  describe("move", function() {
    it("should modify top, bottom, left, and right", function() {
      var input = { top: 10, bottom: 90, left: 10, right: 110, width: 100, height: 80 };
      var expected = { isNormalized: true, top: 30, bottom: 110, left: 60, right: 160, width: 100, height: 80 };
      expect(rect.move(input, 50, 20)).to.eql(expected);
    });
  });
});