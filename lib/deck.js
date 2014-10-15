var _ = require("lodash");
var services = require("./services");
var binder = require("./events").binder;
var Emitter = require("./events").Emitter;
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
 * @param {Object} options - Deck options
 * @param {Object} options.config - Deck configuration settings
 * @param {boolean} options.config.debugEvents - Whether to log events to the console
 * @param {boolean} options.config.debugDrawing - Whether to log drawing actions to the console
 */
function Deck(options) {
  if (!(this instanceof Deck)) { return new Deck(options); }
  if (!options) { throw new Error("options is required"); }

  this.setConfig(_.extend({}, Deck.defaultConfig, options.config));
  this.setEmitter(options.emitter || {
    wildcard: true, // allow "*" wildcards for binding events
    delimiter: ":",
    newListener: false, // don't emit newListener event
    maxListeners: 0 // no limit
  });
  this.setAnimator(options.animator);
  this.setItemCollection(options.itemCollection || options.items || []);
  this.setLayout(options.layout); // required
  this.setFrame(options.frame); // required
  this.setCanvas(options.canvas || {});
  this.setViewport(options.viewport || {});

  this.bindEvents(services.emitter, Deck.emitterEvents);

  services.emitter.emit(DecksEvent("deck:ready", this));
}

/**
 * Default configuration options
 */
Deck.defaultConfig = {
  debugEvents: false,
  debugDrawing: false
};

/**
 * Default Emitter events to bind to
 */
Deck.emitterEvents = {
  "*": "onEmitterEvent"
};

_.extend(Deck.prototype, binder, /** @lends Deck.prototype */ {
  getItems: function() {
    return services.itemCollection.getItems();
  },

  getItem: function(id) {
    return services.itemCollection.getItem(id);
  },

  addItem: function(item, options) {
    services.itemCollection.addItem(item, options);
  },

  addItems: function(items, options) {
    services.itemCollection.addItems(items, options);
  },

  removeItem: function(item, options) {
    services.itemCollection.removeItem(item, options);
  },

  clear: function(options) {
    services.itemCollection.clear(options);
  },

  setFilter: function(filter) {
    services.itemCollection.setFilter(filter);
  },

  setSortBy: function(sortBy) {
    services.itemCollection.setSortBy(sortBy);
  },

  setReversed: function(isReversed) {
    services.itemCollection.setReversed(isReversed);
  },

  setConfig: function(config) {
    services.config = config;
  },

  setEmitter: function(emitter) {
    this.setService("emitter", emitter, Emitter);
  },

  setAnimator: function(animator) {
    this.setService("animator", animator);
  },

  setItemCollection: function(itemCollection) {
    this.setService("itemCollection", itemCollection, ItemCollection);
  },

  setLayout: function(layout) {
    this.setService("layout", layout, Layout);
  },

  setCanvas: function(canvas) {
    this.setService("canvas", canvas, Canvas);
  },

  setFrame: function(frame) {
    this.setService("frame", frame, Frame);
  },

  setViewport: function(viewport) {
    this.setService("viewport", viewport, Viewport);
  },

  setService: function(name, instanceOrOptions, Constructor) {
    if (!instanceOrOptions) { throw new Error(name + " is required"); }
    if (Constructor) {
      if (!(instanceOrOptions instanceof Constructor)) {
        instanceOrOptions = new Constructor(instanceOrOptions);
      }
    }
    services[name] = instanceOrOptions;
    services.emitter.emit(DecksEvent("deck:" + name + ":set", this, services[name]));
  },

  onEmitterEvent: function(e) {
    if (services.config.debugEvents) {
      console.log("event", e);
    }
  }
});

module.exports = Deck;

