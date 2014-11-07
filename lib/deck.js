var _ = require("lodash");
var binder = require("./events").binder;
var hasEmitter = require("./events").hasEmitter;
var DecksEvent = require("./events").DecksEvent;
var ItemCollection = require("./itemcollection");
var Layout = require("./layout");
var Canvas = require("./canvas");
var Frame = require("./frame");
var Viewport = require("./viewport");

/**
 * Top-level API for managing the "decks.js" system.
 * Contains all of the coordinating objects for managing items, collections of items,
 * viewports, layouts, etc.
 *
 * @class
 * @mixes binder
 * @mixes hasEmitter
 * @param {!Object} options - Deck options
 * @param {?Object} [options.config={}] - Deck configuration settings
 * @param {?boolean} [options.config.debugEvents=false] - Whether to log events to the console
 * @param {?boolean} [options.config.debugDrawing=false] - Whether to log drawing actions to the console
 * @param {?boolean} [options.config.debugGestures=false] - Whether to log gesture info to the console
 * @param {?(Object|Emitter)} [options.emitter={}] - Emitter instance or options
 * @param {!Object} options.animator - Object with animate function (like VelocityJS)
 * @param {?(Object|ItemCollection)} [options.itemCollection=[]] - ItemCollection instance or options
 * @param {!(Object|Layout)} options.layout - Layout instance or options
 * @param {!(Object|Frame)} options.frame - Frame instance or options
 * @param {?(Object|Canvas)} [options.canvas={}] - Canvas instance or options
 * @param {?(Object|Viewport)} [options.viewport={}] - Viewport instance or options
 */
function Deck(options) {
  if (!(this instanceof Deck)) {
    return new Deck(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  this.setEmitter(options.emitter || {}, this.emitterEvents);
  this.setConfig(options.config || {});
  this.setAnimator(options.animator);
  this.setItemCollection(options.itemCollection || options.items || []);
  this.setFilter(options.filter);
  this.setSortBy(options.sortBy);
  this.setReversed(!!options.reversed);
  this.setLayout(options.layout);
  this.setFrame(options.frame);
  this.setCanvas(options.canvas || {});
  this.setViewport(options.viewport || {});

  this.emit(DecksEvent("deck:ready", this));
}

_.extend(Deck.prototype, binder, hasEmitter, /** @lends Deck.prototype */ {
  defaultOptions: {
    config: {
      frameClassName: "decks-frame",
      canvasClassName: "decks-canvas",
      itemClassName: "decks-item",
      debugEvents: false,
      debugDrawing: false,
      debugGestures: false
    }
  },

  emitterEvents: {
    "*": "onAnyEvent"
  },

  itemCollectionEvents: {
    "*": "onItemCollectionEvent"
  },

  getItems: function(filter) {
    return this.itemCollection.getItems(filter);
  },

  getItem: function(id) {
    return this.itemCollection.getItem(id);
  },

  addItem: function(item, options) {
    this.itemCollection.addItem(item, options);
  },

  addItems: function(items, options) {
    this.itemCollection.addItems(items, options);
  },

  removeItem: function(item, options) {
    this.itemCollection.removeItem(item, options);
  },

  clear: function(options) {
    this.itemCollection.clear(options);
  },

  setFilter: function(filter) {
    this.itemCollection.setFilter(filter);
  },

  setSortBy: function(sortBy) {
    this.itemCollection.setSortBy(sortBy);
  },

  setReversed: function(isReversed) {
    this.itemCollection.setReversed(isReversed);
  },

  draw: function() {
    this.emit(DecksEvent("deck:draw", this));
  },

  resize: function() {
    this.emit(DecksEvent("deck:resize", this));
  },

  setConfig: function(config) {
    if (!config) {
      throw new Error("Deck#setConfig: config is required");
    }

    if (this.config) {
      throw new Error("Deck#setConfig: config already set");
    }

    this.config = _.merge({}, this.defaultOptions.config, config);

    this.emit(DecksEvent("deck:config:set", this, this.config));
  },

  setAnimator: function(animator) {
    if (!animator) {
      throw new Error("Deck#setAnimator: animator is required");
    }

    if (this.animator) {
      throw new Error("Deck#setAnimator: animator already set");
    }

    this.animator = animator;

    this.emit(DecksEvent("deck:animator:set", this, this.animator));
  },

  setItemCollection: function(itemCollection) {
    if (!itemCollection) {
      throw new Error("Deck#setItemCollection: itemCollection is required");
    }

    if (this.itemCollection) {
      throw new Error("Deck#setItemCollection: itemCollection already set");
    }

    if (!(itemCollection instanceof ItemCollection)) {
      itemCollection = new ItemCollection(itemCollection);
    }

    this.itemCollection = itemCollection;

    // If the ItemCollection has its own emitter, bind and forward all events on the
    // main Deck emitter.
    if (this.emitter !== itemCollection.emitter) {
      this.bindEvents(itemCollection, this.itemCollectionEvents);
    }

    this.emit(DecksEvent("deck:item:collection:set", this, this.layout));
  },

  setLayout: function(layout) {
    if (!layout) {
      throw new Error("Deck#setLayout: layout is required");
    }

    if (this.layout === layout) {
      return;
    }

    if (this.layout) {
      this.layout.unbindEvents(this.emitter, this.layout.emitterEvents);
    }

    if (!(layout instanceof Layout)) {
      _.extend(layout, {
        animator: this.animator,
        config: this.config,
        emitter: this.emitter
      });
      layout = new Layout(layout);
    }

    this.layout = layout;

    this.layout.bindEvents(this.emitter, this.layout.emitterEvents);

    this.emit(DecksEvent("deck:layout:set", this, this.layout));
  },

  setCanvas: function(canvas) {
    if (!canvas) {
      throw new Error("Deck#setCanvas: canvas is required");
    }

    if (this.canvas) {
      throw new Error("Deck#setCanvas: canvas already set");
    }

    if (!(canvas instanceof Canvas)) {
      _.extend(canvas, {
        animator: this.animator,
        config: this.config,
        emitter: this.emitter,
        layout: this.layout
      });
      canvas = new Canvas(canvas);
    }

    this.canvas = canvas;

    this.emit(DecksEvent("deck:canvas:set", this, this.canvas));
  },

  setFrame: function(frame) {
    if (!frame) {
      throw new Frame("Deck#setFrame: frame is required");
    }

    if (this.frame) {
      throw new Error("Deck#setFrame: frame already set");
    }

    if (!(frame instanceof Frame)) {
      _.extend(frame, {
        animator: this.animator,
        config: this.config,
        emitter: this.emitter
      });
      frame = new Frame(frame);
    }

    this.frame = frame;

    this.emit(DecksEvent("deck:frame:set", this, this.frame));
  },

  setViewport: function(viewport) {
    if (!viewport) {
      throw new Error("Deck#setViewport: viewport is required");
    }

    if (this.viewport) {
      throw new Error("Deck#setViewport: viewport already set");
    }

    if (!(viewport instanceof Viewport)) {
      _.extend(viewport, {
        animator: this.animator,
        canvas: this.canvas,
        config: this.config,
        emitter: this.emitter,
        frame: this.frame,
        itemCollection: this.itemCollection,
        layout: this.layout
      });
      viewport = new Viewport(viewport);
    }

    this.viewport = viewport;

    this.emit(DecksEvent("deck:viewport:set", this, this.viewport));
  },

  onAnyEvent: function(e) {
    if (this.config.debugEvents) {
      console.log("Deck#onAnyEvent:", e);
    }
  },

  onItemCollectionEvent: function(e) {
    // Forward itemCollection events on the Deck emitter
    this.emit(e);
  }
});

module.exports = Deck;
