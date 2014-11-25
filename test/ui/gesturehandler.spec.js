var _ = require("lodash");
var tools = require("../testtools");
//var sinon = tools.sinon;
var expect = tools.expect;
var decks = require("../..");
var Deck = decks.Deck;
var Emitter = decks.events.Emitter;
var GestureHandler = decks.ui.GestureHandler;
var dom = decks.ui.dom;

describe("decks.ui.GestureHandler", function() {
  var containerElement;
  var element;
  var emitter;
  var animator;
  var config;
  var options;
  var gestureHandler;

  beforeEach(function() {
    containerElement = dom.create("div");
    dom.setStyles(containerElement, { position: "absolute", top: 0, left: 0, width: 800, height: 600 });
    dom.append(document.body, containerElement);
    element = dom.create("div");
    containerElement.appendChild(element);
    emitter = new Emitter();
    animator = {
      animate: function() { }
    };
    config = Deck.prototype.defaultOptions.config;
    options = {
      element: element,
      emitter: emitter,
      animator: animator,
      config: config
    };
    gestureHandler = new GestureHandler(options);
  });

  afterEach(function() {
    document.body.removeChild(containerElement);
  });

  describe("constructor", function() {
    it("should work with new", function() {
      expect(gestureHandler).to.be.an.instanceOf(GestureHandler);
    });

    it("should work without new", function() {
      gestureHandler = GestureHandler(options);
      expect(gestureHandler).to.be.an.instanceOf(GestureHandler);
    });

    it("should set an emitter", function() {
      expect(gestureHandler.emitter).to.eql(emitter);
    });

    it("should set an animator", function() {
      expect(gestureHandler.animator).to.eql(animator);
    });

    it("should set a config", function() {
      expect(gestureHandler.config).to.eql(config);
    });

    it("should set options", function(){
      _.keys(GestureHandler.prototype.defaultOptions, function(key) {
        expect(gestureHandler[key]).to.eql(GestureHandler.prototype.defaultOptions[key]);
      });
    });

    xit("should bind to emitter events", function() {
      // TODO
    });
  });

  describe("setBounds", function() {
    it("should set the bounds", function() {
      var bounds1 = { top: 0, left: 0, bottom: 100, right: 100, width: 100, height: 100 };
      var bounds2 = { top: 0, left: 0, bottom: 100, right: 100, width: 100, height: 100 };
      gestureHandler.setBounds(bounds1);
      expect(gestureHandler.bounds).to.eql(bounds1);
      gestureHandler.setBounds(bounds2);
      expect(gestureHandler.bounds).to.eql(bounds2);
      gestureHandler.setBounds(bounds2);
      expect(gestureHandler.bounds).to.eql(bounds2);
    });

    it("should set the container element bounds if no bounds provided", function() {
    });
  });

  describe("destroy", function() {
    xit("TODO", function() {
    });
  });

  describe("updatePositionData", function() {
    xit("TODO", function() {
    });
  });

  describe("clearPositionData", function() {
    xit("TODO", function() {
    });
  });

  describe("resetPosition", function() {
    xit("TODO", function() {
    });
  });

  describe("animateMoveToElement", function() {
    xit("TODO", function() {
    });
  });

  describe("stopAnimation", function() {
    xit("TODO", function() {
    });
  });

  describe("animateMoveForPan", function() {
    xit("TODO", function() {
    });
  });

  describe("animateMoveForPanX", function() {
    xit("TODO", function() {
    });
  });

  describe("animateMoveForPanY", function() {
    xit("TODO", function() {
    });
  });

  describe("animateMoveForSwipe", function() {
    xit("TODO", function() {
    });
  });

  describe("animateMoveForSwipeX", function() {
    xit("TODO", function() {
    });
  });

  describe("animateMoveForSwipeY", function() {
    xit("TODO", function() {
    });
  });

  describe("animateMoveX", function() {
    xit("TODO", function() {
    });
  });

  describe("animateMoveY", function() {
    xit("TODO", function() {
    });
  });

  describe("animateMoveXAndY", function() {
    xit("TODO", function() {
    });
  });

  describe("animateMoveXOrY", function() {
    xit("TODO", function() {
    });
  });

  describe("getInertiaDistance", function() {
    xit("TODO", function() {
    });
  });

  describe("getInertiaDuration", function() {
    xit("TODO", function() {
    });
  });

  describe("snapToBounds", function() {
    xit("TODO", function() {
    });
  });

  describe("snapToNearestChildElement", function() {
    xit("TODO", function() {
    });
  });

  describe("onAnimationComplete", function() {
    xit("TODO", function() {
    });
  });

  describe("onGesturePanStart", function() {
    xit("TODO", function() {
    });
  });

  describe("onGesturePanAny", function() {
    xit("TODO", function() {
    });
  });

  describe("onGesturePanX", function() {
    xit("TODO", function() {
    });
  });

  describe("onGesturePanY", function() {
    xit("TODO", function() {
    });
  });

  describe("onGesturePanEnd", function() {
    xit("TODO", function() {
    });
  });

  describe("onGesturePanCancel", function() {
    xit("TODO", function() {
    });
  });

  describe("onGestureSwipeAny", function() {
    xit("TODO", function() {
    });
  });

  describe("onGestureSwipeX", function() {
    xit("TODO", function() {
    });
  });

  describe("onGestureSwipeY", function() {
    xit("TODO", function() {
    });
  });

  describe("onGestureTap", function() {
    xit("TODO", function() {
    });
  });

  describe("onGesturePress", function() {
    xit("TODO", function() {
    });
  });
});
