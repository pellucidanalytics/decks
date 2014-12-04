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

  describe("resizing and movement", function() {
    var input;
    var deltaWidth;
    var deltaHeight;
    var deltaX;
    var deltaY;

    beforeEach(function() {
      input = {
        top: 10,
        bottom: 90,
        left: 10,
        right: 110,
        width: 100,
        height: 80
      };
      deltaWidth = 50;
      deltaHeight = 20;
      deltaX = 15;
      deltaY = 25;
    });

    describe("resize", function() {
      it("should modify right, bottom, width and height", function() {
        var expected = {
          isNormalized: true,
          top: 10,
          bottom: 110,
          left: 10,
          right: 160,
          width: 150,
          height: 100
        };
        expect(rect.resize(input, deltaWidth, deltaHeight)).to.eql(expected);
      });
    });

    describe("resizeWidth", function() {
      it("should modify width and right", function() {
        var expected = {
          isNormalized: true,
          top: 10,
          bottom: 90,
          left: 10,
          right: 160,
          width: 150,
          height: 80
        };
        expect(rect.resizeWidth(input, deltaWidth)).to.eql(expected);
      });
    });

    describe("resizeHeight", function() {
      it("should modify height and bottom", function() {
        var expected = {
          isNormalized: true,
          top: 10,
          bottom: 110,
          left: 10,
          right: 110,
          width: 100,
          height: 100
        };
        expect(rect.resizeHeight(input, deltaHeight)).to.eql(expected);
      });
    });

    describe("resizeTo", function() {
      it("should modify width, height, right, and bottom", function() {
        var expected = {
          isNormalized: true,
          top: 10,
          bottom: 75,
          left: 10,
          right: 65,
          width: 55,
          height: 65
        };
        expect(rect.resizeTo(input, 55, 65)).to.eql(expected);
      });
    });

    describe("resizeToWidth", function() {
      it("should modify width and right", function() {
        var expected = {
          isNormalized: true,
          top: 10,
          bottom: 90,
          left: 10,
          right: 65,
          width: 55,
          height: 80
        };
        expect(rect.resizeToWidth(input, 55)).to.eql(expected);
      });
    });

    describe("resizeToHeight", function() {
      it("should modify height and bottom", function() {
        var expected = {
          isNormalized: true,
          top: 10,
          bottom: 65,
          left: 10,
          right: 110,
          width: 100,
          height: 55
        };
        expect(rect.resizeToHeight(input, 55)).to.eql(expected);
      });
    });

    describe("move", function() {
      it("should modify top, bottom, left, and right", function() {
        var expected = {
          isNormalized: true,
          top: 30,
          bottom: 110,
          left: 60,
          right: 160,
          width: 100,
          height: 80
        };
        expect(rect.move(input, 50, 20)).to.eql(expected);
      });
    });

    describe("moveX", function() {
      it("should modify left and right", function() {
        var expected = {
          isNormalized: true,
          top: 10,
          bottom: 90,
          left: 60,
          right: 160,
          width: 100,
          height: 80
        };
        expect(rect.moveX(input, 50)).to.eql(expected);
      });
    });

    describe("moveY", function() {
      it("should modify top and bottom", function() {
        var expected = {
          isNormalized: true,
          top: 60,
          bottom: 140,
          left: 10,
          right: 110,
          width: 100,
          height: 80
        };
        expect(rect.moveY(input, 50)).to.eql(expected);
      });
    });

    describe("moveTo", function() {
      it("should modify left, right, top and bottom", function() {
        var expected = {
          isNormalized: true,
          top: 60,
          bottom: 140,
          left: 50,
          right: 150,
          width: 100,
          height: 80
        };
        expect(rect.moveTo(input, 50, 60)).to.eql(expected);
      });
    });

    describe("moveToX", function() {
      it("should modify left and right", function() {
        var expected = {
          isNormalized: true,
          top: 10,
          bottom: 90,
          left: 50,
          right: 150,
          width: 100,
          height: 80
        };
        expect(rect.moveToX(input, 50)).to.eql(expected);
      });
    });

    describe("moveToY", function() {
      it("should modify top and bottom", function() {
        var expected = {
          isNormalized: true,
          top: 50,
          bottom: 130,
          left: 10,
          right: 110,
          width: 100,
          height: 80
        };
        expect(rect.moveToY(input, 50)).to.eql(expected);
      });
    });
  });

  describe("distance", function() {
    it("should calculate distance", function() {
      expect(rect.distance({ top: 0, left: 0}, { top: 0, left: 0 })).to.eql(0);
      expect(rect.distance({ top: 0, left: 0}, { top: 30, left: 40 })).to.eql(50);
      expect(rect.distance({ top: 0, left: 0}, { top: -30, left: -40 })).to.eql(50);
      expect(rect.distance({ top: -10, left: -10}, { top: 20, left: 30 })).to.eql(50);
    });
  });
});
