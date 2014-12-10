var _ = require("lodash");
var binder = require("./events").binder;
var hasEmitter = require("./events").hasEmitter;
var DecksEvent = require("./events").DecksEvent;
var Item = require("./item");
var ItemCollection = require("./itemcollection");
var Layout = require("./layout");
var Canvas = require("./canvas");
var Frame = require("./frame");
var Viewport = require("./viewport");
var validate = require("./utils/validate");

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

  validate.isEnabled = !!options.config.validation;

  this.setEmitter(options.emitter || {});
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

  this.bind();

  this.emit(DecksEvent("deck:ready", this));
}

_.extend(Deck.prototype, binder, hasEmitter, /** @lends Deck.prototype */ {
  /**
   * Default global {@link Deck} options.
   */
  defaultOptions: {
    config: {
      frameClassName: "decks-frame",
      canvasClassName: "decks-canvas",
      itemClassName: "decks-item",
      customRenderClassName: "decks-custom-render",
      debugEvents: false,
      debugDrawing: false,
      debugGestures: false,
      validation: true
    }
  },

  /**
   * Events to bind to on the shared {@link Emitter}.
   */
  getEmitterEvents: function() {
    return {
      "*": "onAnyEmitterEvent"
    };
  },

  /**
   * Events to bind to on the {@link ItemCollection}
   */
  getItemCollectionEvents: function() {
    return {
      "*": "onAnyItemCollectionEvent"
    };
  },

  /**
   * Binds the {@link Emitter} and {@link ItemCollection} event handlers.
   *
   * @return {undefined}
   */
  bind: function() {
    this.bindEvents(this.emitter, this.getEmitterEvents());

    if (this.itemCollection.emitter !== this.emitter) {
      this.bindEvents(this.itemCollection, this.getItemCollectionEvents());
    }
  },

  /**
   * Unbinds the {@link Emitter} and {@link ItemCollection} event handlers.
   *
   * @return {undefined}
   */
  unbind: function() {
    this.unbindEvents(this.emitter, this.getEmitterEvents());

    if (this.itemCollection.emitter !== this.emitter) {
      this.unbindEvents(this.itemCollection, this.getItemCollectionEvents());
    }
  },

  /**
   * Gets {@link Item}s from the {@link ItemCollection}
   *
   * @param {?Function} [filter=undefined] - optional filter function which takes an {@link Item}
   * @return {undefined}
   */
  getItems: function getItems(filter) {
    return this.itemCollection.getItems(filter);
  },

  /**
   * Gets an {@link Item} by {@link Item} id
   *
   * @param id
   * @return {undefined}
   */
  getItem: function getItem(id) {
    return this.itemCollection.getItem(id);
  },

  /**
   * Adds an {@link Item} to the {@link ItemCollection}
   *
   * @param item
   * @param options
   * @return {undefined}
   */
  addItem: function addItem(item, options) {
    this.itemCollection.addItem(item, options);
  },

  /**
   * Adds {@link Item}s to the {@link ItemCollection}
   *
   * @param items
   * @param options
   * @return {undefined}
   */
  addItems: function addItems(items, options) {
    this.itemCollection.addItems(items, options);
  },

  /**
   * Removes an {@link Item} from the {@link ItemCollection}.
   *
   * @param item
   * @param options
   * @return {undefined}
   */
  removeItem: function removeItem(item, options) {
    this.itemCollection.removeItem(item, options);
  },

  /**
   * Clears all {@link Item}s from the {@link ItemCollection}
   *
   * @param options
   * @return {undefined}
   */
  clear: function clear(options) {
    this.itemCollection.clear(options);
  },

  /**
   * Sets a filter function on the {@link ItemCollection}.  Items that do not pass the filter
   * function will have their {@link Item} index set to -1, which may cause the renders for the
   * {@link Item} to be hidden on the next draw cycle.
   *
   * @param filter
   * @return {undefined}
   */
  setFilter: function setFilter(filter, options) {
    this.itemCollection.setFilter(filter, options);
  },

  /**
   * Sets a sort by function on the {@link ItemCollection}.  The sort by function will be run over
   * the {@link ItemCollection} and may cause the indices to change on zero or more {@link Item}s.
   * This triggers a redraw for any {@link Item} whose index changes.
   *
   * @param sortBy
   * @return {undefined}
   */
  setSortBy: function setSortBy(sortBy, options) {
    this.itemCollection.setSortBy(sortBy, options);
  },

  /**
   * Sets a reversed flag on the {@link ItemCollection} which reverses all the indices of the {@link Item}s.
   * This triggers a redraw if any {@link Item} indices change.
   *
   * @param isReversed
   * @return {undefined}
   */
  setReversed: function setReversed(isReversed, options) {
    this.itemCollection.setReversed(isReversed, options);
  },

  /**
   * Requests a manual redraw and reload cycle on all the items.
   *
   * This is normally not needed, as decks will attempt to always redraw and reload
   * whenever necessary, but can be used to force a redraw/reload to happen.
   *
   * @return {undefined}
   */
  draw: function draw() {
    this.emit(DecksEvent("deck:draw", this));
  },

  /**
   * Requests that the {@link Frame} re-calculate it's bounds.  If the bounds have changed,
   * it will trigger a redraw, which allows the {@link Viewport} to request new renders from
   * the {@link Layout} which might result in renders moving to fit in the new {@link Frame} size.
   *
   * @return {undefined}
   */
  resize: function resize() {
    this.emit(DecksEvent("deck:resize", this));
  },

  /**
   * Pans the {@link Canvas} to the given {@link Item}, with an optional render id (defaults to the first render element).
   *
   * @param {!(Item|string)} itemOrItemId - the item or item id to pan to
   * @param {?(string|number)} [renderIdOrIndex=0] - the render id or index of the element to pan to
   * * (defaults to the first render element for the item)
   * @return {undefined}
   */
  panToItem: function panToItem(itemOrItemId, renderIdOrIndex) {
    var item;
    if (itemOrItemId instanceof Item) {
      item = itemOrItemId;
    } else if (_.isString(itemOrItemId)) {
      item = this.getItem(itemOrItemId);
    } else if (_.isNumber(itemOrItemId)) {
      item = this.getItem("" + itemOrItemId);
    } else if (_.has(itemOrItemId, "id")) {
      var id = itemOrItemId.id;
      if (_.isNumber(id)) {
        id = "" + id;
      }
      item = this.getItem(id);
    }
    this.viewport.panToItem(item, renderIdOrIndex);
  },

  /**
   * Sets a new {@link Layout}, and pans to the given {@link Item} when the new layout draw cycle completes.
   *
   * @param {Layout} layout - new layout to set
   * @param {!(Item|string)} itemOrItemId - item or item id
   * @param {?(string|number)} [renderIdOrIndex=0] - render id or index (defaults to the first render for the {@link Item})
   * @return {undefined}
   */
  setLayoutAndPanToItem: function setLayoutAndPanToItem(layout, itemOrItemId, renderIdOrIndex) {
    var self = this;

    // Listen for the completion of the next drawing cycle (this should be emitted when
    // the drawing cycle for new layout completes).  At that point, pan to the item.
    self.once("viewport:all:renders:drawn", function() {
      self.panToItem(itemOrItemId, renderIdOrIndex);
    });

    self.setLayout(layout);
  },

  /**
   * Binds the {@link Canvas}'s {@link GestureHandler} events.
   *
   * @return {undefined}
   */
  bindCanvasGestureHandler: function bindCanvasGestureHandler() {
    this.canvas.bindGestureHandler();
  },

  /**
   * Unbinds the {@link Canvas}'s {@link GestureHandler} events.
   *
   * @return {undefined}
   */
  unbindCanvasGestureHandler: function unbindCanvasGestureHandler() {
    this.canvas.unbindGestureHandler();
  },

  /**
   * Sets the config object.
   *
   * @param config
   * @return {undefined}
   */
  setConfig: function setConfig(config) {
    validate(config, "config", { isPlainObject: true, isNotSet: this.config });

    this.config = config;

    this.emit(DecksEvent("deck:config:set", this, this.config));
  },

  /**
   * Sets the animator object.
   *
   * @param animator
   * @return {undefined}
   */
  setAnimator: function setAnimator(animator) {
    validate(animator, "animator", { isPlainObject: true, isNotSet: this.animator });

    this.animator = animator;

    this.emit(DecksEvent("deck:animator:set", this, this.animator));
  },

  /**
   * Sets the {@link ItemCollection}.
   *
   * @param itemCollection
   * @return {undefined}
   */
  setItemCollection: function setItemCollection(itemCollection) {
    validate(itemCollection, "itemCollection", { isRequired: true, isNotSet: this.itemCollection });

    if (!(itemCollection instanceof ItemCollection)) {
      itemCollection = new ItemCollection(itemCollection);
    }

    this.itemCollection = itemCollection;

    this.emit(DecksEvent("deck:item:collection:set", this, this.layout));
  },

  /**
   * Sets the {@link Layout}
   *
   * @param layout
   * @return {undefined}
   */
  setLayout: function setLayout(layout) {
    validate(layout, "layout", { isRequired: true });

    if (this.layout === layout) {
      return;
    }

    this.emit(DecksEvent("deck:layout:setting", this, { oldLayout: this.layout, newLayout: layout }));

    // Unbind the previous layout from emitter events
    if (this.layout) {
      this.layout.unbindEvents(this.emitter, this.layout.getEmitterEvents());
    }

    if (!(layout instanceof Layout)) {
      layout = new Layout(layout);
    }

    this.layout = layout;
    this.layout.bindEvents(this.emitter, this.layout.getEmitterEvents());

    this.emit(DecksEvent("deck:layout:set", this, this.layout));
  },

  /**
   * Sets the {@link Frame}
   *
   * @param frame
   * @return {undefined}
   */
  setFrame: function setFrame(frame) {
    validate(frame, "frame", { isRequired: true, isNotSet: this.frame });

    if (!(frame instanceof Frame)) {
      _.extend(frame, {
        emitter: this.emitter,
        config: this.config,
        animator: this.animator
      });
      frame = new Frame(frame);
    }

    this.frame = frame;

    this.emit(DecksEvent("deck:frame:set", this, this.frame));
  },

  /**
   * Sets the {@link Canvas}
   *
   * @param canvas
   * @return {undefined}
   */
  setCanvas: function setCanvas(canvas) {
    validate(canvas, "canvas", { isRequired: true, isNotSet: this.canvas });

    if (!(canvas instanceof Canvas)) {
      _.extend(canvas, {
        emitter: this.emitter,
        config: this.config,
        animator: this.animator,
        layout: this.layout
      });
      canvas = new Canvas(canvas);
    }

    this.canvas = canvas;

    this.emit(DecksEvent("deck:canvas:set", this, this.canvas));
  },

  /**
   * Sets the {@link Viewport}
   *
   * @param viewport
   * @return {undefined}
   */
  setViewport: function setViewport(viewport) {
    validate(viewport, "viewport", { isRequired: true, isNotSet: this.viewport });

    if (!(viewport instanceof Viewport)) {
      _.extend(viewport, {
        emitter: this.emitter,
        config: this.config,
        animator: this.animator,
        itemCollection: this.itemCollection,
        layout: this.layout,
        frame: this.frame,
        canvas: this.canvas
      });
      viewport = new Viewport(viewport);
    }

    this.viewport = viewport;

    this.emit(DecksEvent("deck:viewport:set", this, this.viewport));
  },

  /**
   * Called on any {@link Emitter} event.
   *
   * @param e
   * @return {undefined}
   */
  onAnyEmitterEvent: function onAnyEmitterEvent(e) {
    if (this.config.debugEvents) {
      console.log("Deck#onAnyEmitterEvent:", e);
    }
  },

  /**
   * Called on any {@link ItemCollection} event.
   *
   * @param e
   * @return {undefined}
   */
  onAnyItemCollectionEvent: function onAnyItemCollectionEvent(e) {
    // Forward itemCollection events on the main Deck emitter
    this.emit(e);
  }
});

module.exports = Deck;
