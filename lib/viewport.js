var _ = require("lodash");
var binder = require("./events").binder;
var hasEmitter = require("./events").hasEmitter;
var DecksEvent = require("./events").DecksEvent;
var dom = require("./ui").dom;
var ItemCollection = require("./itemcollection");
var Item = require("./item");
var Layout = require("./layout");
var Frame = require("./frame");
var Canvas = require("./canvas");
var validate = require("./utils/validate");
//var raf = require("raf");
var GestureHandler = require("./ui/gesturehandler");
var GestureHandlerGroup = require("./ui/gesturehandlergroup");
var logger = require("./utils/logger");

/**
 * Viewport - manages visual (DOM) components
 *
 * @class
 * @mixes binder
 * @mixes hasEmitter
 * @param {!Object} options - options for viewport initialization
 * @param {!Object} options.animator - Animator object
 * @param {!Object} options.config - Configuration object
 * @param {!(Emitter|Object)} options.emitter - Emitter instance or options object
 * @param {!ItemCollection} options.itemCollection - ItemCollection instance
 * @param {!Layout} options.layout - Layout instance
 * @param {!Frame} options.frame - Frame instance
 * @param {!Canvas} options.canvas - Canvas instance
 */
function Viewport(options) {
  if (!(this instanceof Viewport)) {
    return new Viewport(options);
  }

  options = _.merge({}, this.defaultOptions, options);

  /** Whether to run a draw cycle when the deck:ready event is handled */
  this.drawOnDeckReady = options.drawOnDeckReady;

  /** Debounced version of {@link Viewport#onGestureElementMoved} */
  this.debouncedLoadOrUnloadRenders = _.debounce(this.loadOrUnloadRenders, options.debouncedLoadOrUnloadRendersWait);

  /**
   * Data structure for storing the items and corresponding renders
   *
   * The data structure is a 2-level tree.  At the first level, the key is the item.id.
   * The value at the first level is an object with render.ids as keys.  The value At
   * the second level is the render object, e.g.
   *
   * @example Internal Viewport renders data structure
   * {
   *   // Item 1
   *   "item-id-1": {
   *     // Render "0" for Item 1
   *     "0": {
   *       "id": "0",
   *       "index": 0,
   *       "transform": {
   *         "top": 120,
   *         "left": 140
   *         ...
   *       },
   *       "animateOptions": {
   *         ...
   *       }
   *     },
   *     // Render "1" for Item 1
   *     "1": {
   *       "id": "1",
   *       "index": 1,
   *       "transform": {
   *         "top": 120,
   *         "left": 140
   *         ...
   *       },
   *       "animateOptions": {
   *         ...
   *       }
   *     }
   *   },
   *   // Item 2
   *   "item-id-2": {
   *     // Render "0" for Item 2
   *     "0": {
   *       "id": "0",
   *       "index": 1,
   *       "transform": ...
   *     }
   *   }
   * }
   */
  this.renders = {};

  /**
   * Keyed object of custom render objects.  The key is the custom Render id.
   *
   * A custom render is an object with an element/transform/etc., which is drawn on the
   * {@link Canvas}, but is not associated with an {@link Item} in the {@link ItemCollection}.
   *
   * This might be a custom divider line, label, etc.
   *
   * @example Internal Viewport custom renders data structure
   * {
   *   "0": {
   *     element: ...,
   *     transform: {
   *       ...
   *     },
   *     animateOptions: {
   *       ...
   *     },
   *     someOtherProperty: {
   *       ...
   *     }
   *   }
   * }
   */
  this.customRenders = {};

  /** Keeps track of how many renders are currently being drawn */
  this.renderAnimationCount = 0;

  /** Keeps track of the number of custom renders being drawn */
  this.customRenderAnimationCount = 0;

  /** Keeps track of {@link GestureHandlerGroup}s */
  this.gestureHandlerGroups = {};

  /** Whether to stop animations when a new cWRITTEN ON JAN 27 BY
Mikeal
A martial arts rock band goes up against a band of motorcycle ninjas who have tightened their grip on Florida's narcotics trade. http://t.co/uKkHu3tAycle starts while one is already running */
  this.useAnimationStopping = options.useAnimationStopping;

  /**
   * Flag that indicates if the deck is ready.  Drawing actions are suppressed
   * until the deck is signaled as ready
   */
  this.isDeckReady = false;

  /** Whether drawing is enabled */
  this.isDrawingEnabled = options.isDrawingEnabled;

  /**
   * Object of properties to pass to all {@link Layout} methods invoked by the {@link Viewport}
   * This is to provide the {@link Layout} methods with more context for their logic.
   */
  this.layoutMethodOptions = {
    viewport: this
  };

  this.setAnimator(options.animator);
  this.setConfig(options.config);
  this.setEmitter(options.emitter);
  this.setDeck(options.deck);
  this.setItemCollection(options.itemCollection);
  this.setLayout(options.layout);
  this.setFrame(options.frame);
  this.setCanvas(options.canvas);

  this.layoutMethodOptions.emitter = this.emitter;

  this.bind();

  this.emit(DecksEvent("viewport:ready", this));
}

_.extend(Viewport.prototype, binder, hasEmitter, /** @lends Viewport.prototype */ {
  /**
   * Default options for instances of Viewport
   */
  defaultOptions: {
    /** Whether to run a draw cycle on deck:ready */
    drawOnDeckReady: true,

    /** Whether drawing is enabled */
    isDrawingEnabled: true,

    /** Whether to stop animations when a draw cycle happens while another cycle is running */
    useAnimationStopping: true,

    /** Wait time for debounced loadOrUnloadRenders function */
    debouncedLoadOrUnloadRendersWait: 400
  },

  /**
   * Event to method mapping for binding to the decks emitter.
   */
  getEmitterEvents: function getEmitterEvents() {
    return {
      // Deck
      "deck:ready": "onDeckReady",
      "deck:draw": "onDeckDraw",
      "deck:layout:setting": "onDeckLayoutSetting",
      "deck:layout:set": "onDeckLayoutSet",

      // Frame
      "frame:bounds:setting": "onFrameBoundsSetting",
      "frame:bounds:set": "onFrameBoundsSet",

      // Item
      "item:changed": "onItemChanged",
      //"item:index:changed": "onItemIndexChanged",

      // ItemCollection
      "item:collection:item:adding": "onItemCollectionItemAdding",
      "item:collection:item:added": "onItemCollectionItemAdded",
      "item:collection:items:adding": "onItemCollectionItemsAdding",
      "item:collection:items:added": "onItemCollectionItemsAdded",
      "item:collection:item:removing": "onItemCollectionItemRemoving",
      "item:collection:item:removed": "onItemCollectionItemRemoved",
      "item:collection:clearing": "onItemCollectionClearing",
      "item:collection:cleared": "onItemCollectionCleared",
      "item:collection:filter:setting": "onItemCollectionFilterSetting",
      //"item:collection:filter:set": "onItemCollectionFilterSet",
      "item:collection:sort:by:setting": "onItemCollectionSortBySetting",
      //"item:collection:sort:by:set": "onItemCollectionSortBySet",
      "item:collection:reversed:setting": "onItemCollectionReversedSetting",
      //"item:collection:reversed:set": "onItemCollectionReversedSet",
      "item:collection:indexing": "onItemCollectionIndexing",
      "item:collection:indexed": "onItemCollectionIndexed",

      // Gestures
      "gesture:element:moved": "onGestureElementMoved"
    };
  },

  /**
   * Binds all {@link Viewport} event handlers
   *
   * @return {undefined}
   */
  bind: function bind() {
    this.bindEvents(this.emitter, this.getEmitterEvents());
  },

  /**
   * Unbinds all {@link Viewport} event handlers
   *
   * @return {undefined}
   */
  unbind: function unbind() {
    this.unbindEvents(this.emitter, this.getEmitterEvents());
  },

  /**
   * Binds all {@link GestureHandlerGroup}s managed by the {@link Viewport}
   *
   * @return {undefined}
   */
  bindGestures: function bindGestures() {
    if (this.gestureHandlerGroups) {
      _.each(this.gestureHandlerGroups, function(gestureHandlerGroup) {
        gestureHandlerGroup.bind();
      }, this);
    }
  },

  /**
   * Unbinds all {@link GestureHandlerGroup}s managed by the {@link Viewport}
   *
   * @return {undefined}
   */
  unbindGestures: function bindGestures() {
    if (this.gestureHandlerGroups) {
      _.each(this.gestureHandlerGroups, function(gestureHandlerGroup) {
        gestureHandlerGroup.unbind();
      }, this);
    }
  },

  /**
   * Destroys the {@link Viewport}
   *
   * @return {undefined}
   */
  destroy: function destroy() {
    this.unbind();

    if (this.gestureHandlerGroups) {
      _.each(this.gestureHandlerGroups, function(gestureHandlerGroup) {
        gestureHandlerGroup.destroy();
      }, this);
    }
  },

  /**
   * Sets the animator instance
   *
   * @param animator
   * @return {undefined}
   */
  setAnimator: function setAnimator(animator) {
    validate(animator, "animator", { isPlainObject: true, isNotSet: this.animate });
    this.animator = this.layoutMethodOptions.animator = animator;
  },

  /**
   * Sets the configuration object
   *
   * @param config
   * @return {undefined}
   */
  setConfig: function setConfig(config) {
    validate(config, "config", { isPlainObject: true, isNotSet: this.config });
    this.config = this.layoutMethodOptions.config = config;
  },

  /**
   * Sets the deck instance.
   *
   * @param deck
   * @return {undefined}
   */
  setDeck: function setDeck(deck) {
    validate(deck, "Viewport#setDeck: deck", { isRequired: true });
    this.deck = this.layoutMethodOptions.deck = deck;
  },

  /**
   * Sets the {@link ItemCollection} instance
   *
   * @param itemCollection
   * @return {undefined}
   */
  setItemCollection: function setItemCollection(itemCollection) {
    validate(itemCollection, "itemCollection", { isInstanceOf: ItemCollection, isNotSet: this.itemCollection });
    this.itemCollection = this.layoutMethodOptions.itemCollection = itemCollection;
  },

  /**
   * Sets the {@link Layout} instance
   *
   * @param layout
   * @return {undefined}
   */
  setLayout: function setLayout(layout) {
    validate(layout, "layout", { isInstanceOf: Layout });
    this.layout = this.layoutMethodOptions.layout = layout;
  },

  /**
   * Sets the {@link Frame} instance
   *
   * @param frame
   * @return {undefined}
   */
  setFrame: function setFrame(frame) {
    validate(frame, "frame", { isInstanceOf: Frame, isNotSet: this.frame });
    this.frame = this.layoutMethodOptions.frame = frame;
  },

  /**
   * Sets the {@link Canvas} instance
   *
   * @param canvas
   * @return {undefined}
   */
  setCanvas: function setCanvas(canvas) {
    validate(canvas, "canvas", { isInstanceOf: Canvas, isNotSet: this.canvas });
    this.canvas = this.layoutMethodOptions.canvas = canvas;
  },

  /**
   * Indicates whether the {@link Viewport} can draw.  This check is based on the isDeckReady flag,
   * the isDrawingEnabled flag, and possibly other conditions.
   *
   * @param {boolean} [canDrawCondition=undefined] - extra condition to check
   * @return {boolean} - true if drawing can be done, otherwise false
   */
  canDraw: function canDraw(canDrawCondition) {
    canDrawCondition = _.isBoolean(canDrawCondition) ? canDrawCondition : true;

    if (!canDrawCondition) {
      if (this.config.debugDrawing) {
        console.warn("Viewport#canDraw: not drawing - can draw condition is false");
      }
      return false;
    }

    if (!this.isDeckReady) {
      if (this.config.debugDrawing) {
        console.warn("Viewport#canDraw: not drawing - deck is not ready");
      }
      return false;
    }

    if (!this.isDrawingEnabled) {
      if (this.config.debugDrawing) {
        console.warn("Viewport#canDraw: not drawing - drawing is disabled");
      }
      return false;
    }

    return true;
  },

  /**
   * Enables drawing
   *
   * @return {undefined}
   */
  enableDrawing: function enableDrawing() {
    /*
    if (this.config.debugDrawing) {
      console.log("Viewport#enableDrawing: enabling drawing");
    }
    */

    this.isDrawingEnabled = true;
  },

  /**
   * Disables drawing
   *
   * @return {undefined}
   */
  disableDrawing: function disableDrawing() {
    /*
    if (this.config.debugDrawing) {
      console.log("Viewport#disableDrawing: disabling drawing");
    }
    */

    this.isDrawingEnabled = false;
  },

  /**
   * Starts the drawing (animation) process for an {@link Item}.
   *
   * 1. Get one or more "render" objects from the {@link Layout} for the {@link Item}.  A "render" is
   * an object that specifies where to place an item in the canvas, along with animation
   * options to animate the positioning/transform/delay/druation/etc.  A Layout can provide zero, one,
   * or more renders for an single {@link Item}, if the {@link Item} needs to be displayed multiple times within
   * the {@link Canvas} (e.g. if one {@link Item} should have multiple visual representations on the screen).
   *
   * 2. Initiate the async draw (animation) process for each render.
   *
   * @param {!Item} item item to draw
   * @param {?Object} options - additional options for drawing
   * @return {undefined}
   */
  drawItem: function drawItem(item, options) {
    validate(item, "item", { isInstanceOf: Item });
    options = options || {};

    /*
    if (this.config.debugDrawing) {
      console.log("Viewport#drawItem: drawing item", item.id);
    }
    */

    if (!options.silent) {
      this.emit(DecksEvent("viewport:item:drawing", this, item));
    }

    var layoutRenders = this.layout.getRenders(item, this.layoutMethodOptions);

    if (_.isNull(layoutRenders) || _.isUndefined(layoutRenders)) {
      layoutRenders = [];
    } else if (!_.isArray(layoutRenders)) {
      layoutRenders = [layoutRenders];
    }

    var renders = {};

    _.each(layoutRenders, function(render, index) {
      // Assign ids to each render (based on the array index), and change it from an array to
      // an object with the render id as the key, and the render as the value.  Also, add some additional
      // data to the render, like the item.
      render.id = "" + index;
      render.index = index;
      render.item = item;

      renders[render.id] = render;
    });

    this.drawRenders(item, renders);
  },

  /**
   * Starts the drawing process for all Items in the ItemCollection.
   *
   * @return {undefined}
   */
  drawItems: function drawItems(items, options) {
    items = _.isArray(items) ? items : this.itemCollection.getItems();
    options = options || {};

    if (items.length === 0) {
      return;
    }

    /*
    if (this.config.debugDrawing) {
      console.log("Viewport#drawItems: drawing items (length %d)", items.length);
    }
    */

    if (!options.silent) {
      this.emit(DecksEvent("viewport:items:drawing", this, items));
    }

    _.each(items, function(item) {
      this.drawItem(item, { silent: true });
    }, this);
  },

  /**
   * Starts the erasing process for an Item.  All of the renders for the Item will
   * be "erased" (removed from the DOM), possibly with an removal animation.  Once
   * each render is "erased" the actual render object is removed from the renders data
   * structure.  Once all of the Item's renders are removed, the item itself will be
   * removed from the renders data structure.
   *
   * @param {Item} item item for which to remove renders
   * @return {undefined}
   */
  eraseItem: function eraseItem(item, options) {
    validate(item, "item", { isInstanceOf: Item });
    options = options || {};

    if (item.isErasing) {
      return;
    }

    /*
    if (this.config.debugDrawing) {
      console.log("Viewport#eraseItem: erasing item", item.id);
    }
    */

    if (!options.silent) {
      this.emit(DecksEvent("viewport:item:erasing", this, item));
    }

    item.isErasing = true;

    this.eraseRenders(item);
  },

  /**
   * Starts the erasing process for all the Items in the ItemCollection.
   *
   * @return {undefined}
   */
  eraseItems: function eraseItems(items, options) {
    items = _.isArray(items) ? items : this.itemCollection.getItems();
    options = options || {};

    if (items.length === 0) {
      return;
    }

    /*
    if (this.config.debugDrawing) {
      console.log("Viewport#eraseItem: erasing items (length %d)", items.length);
    }
    */

    if (!options.silent) {
      this.emit(DecksEvent("viewport:items:erasing", this, items));
    }

    _.each(items, function(item) {
      this.eraseItem(item, { silent: true });
    }, this);
  },

  /**
   * Removes an item from the internal items/renders data structure.  This is called
   * automatically after eraseItem, once all the renders have been erased and removed.
   * This should not be called directly.
   *
   * @param {!Item} item Item to remove
   * @return {undefined}
   */
  removeItem: function removeItem(item, options) {
    validate(item, "item", { isInstanceOf: Item });
    options = options || {};

    /*
    if (this.config.debugDrawing) {
      console.log("Viewport#removeItem: removing item", item.id);
    }
    */

    delete this.renders[item.id];

    if (!options.silent) {
      this.emit(DecksEvent("viewport:item:erased", this, item));
    }
  },

  /**
   * Gets the renders object for the given Item.
   *
   * This returns the renders currently stored in the Viewport instance,
   * it does not request new renders from the Layout.
   *
   * @param {?Item} item item for which to get renders, or if not specified, get all renders
   * @return {Object[]} array of renders for the given item
   */
  getRenders: function getRenders(item) {
    // If no item specified, return all current renders
    if (!item) {
      return _(this.renders) // object with item ids as keys, with values of objects with render ids as keys
        .map(_.values) // array of objects that have render ids as keys
        .map(_.values) // array of arrays of render objects
        .flatten() // array of render objects
        .value();
    }

    validate(item, "item", { isInstanceOf: Item });

    if (!this.renders[item.id]) {
      this.renders[item.id] = {};
    }

    return this.renders[item.id];
  },

  /**
   * Gets a single render object for an {@link Item}.
   *
   * @param {!Item} item - Item for which t o get render
   * @param {!(String|Number)} [renderIdOrIndex=0] - render id or index
   * @return {Object} - the render object (if exists)
   */
  getRender: function getRender(item, renderIdOrIndex) {
    validate(item, "item", { isInstanceOf: Item });

    var renderId = "" + (renderIdOrIndex || 0);

    return this.getRenders(item)[renderId];
  },

  /**
   * Checks if an Item currently has any renders stored in the Viewport items/renders
   * data structure.
   *
   * @param {?Item} item - Item for which to check for the existence of renders (or undefined to see if any renders exist)
   * @return {boolean} true if the Item has renders, otherwise false
   */
  hasRenders: function hasRenders(item) {
    return !_.isEmpty(this.getRenders(item));
  },

  /**
   * Stores the given render object in the Viewports internal items/renders data structure.
   *
   * This is called automatically after a render has been drawn (after the animation completes).
   * This should not be called directly.
   *
   * @param {!Object} render render to store
   * @return {undefined}
   */
  setRender: function setRender(render) {
    validate(render, "render", { isRequired: true });
    validate(render.item, "render.item", { isInstanceOf: Item });

    /*
    if (this.config.debugDrawing) {
      console.log("Viewport#setRender: setting render", render.item.id, render.id);
    }
    */

    var renders = this.getRenders(render.item);

    renders[render.id] = render;
  },

  /**
   * Starts the drawing process for a render.
   *
   * A render is an object which contains a DOM element - the render "container" element,
   * a "transform" - a hash of CSS properties and values to animate/set, and an "animateOptions"
   * which is a hash of animation properties, like duration, easing, etc.  A render is drawn
   * by executing the transform on the element, using a compatible animation function like
   * VelocityJS.  The drawing/animation process is asynchronous - this method starts the process,
   * and callbacks are used to track completion of the animation.
   *
   * @param {!Object} options animation options
   * @param {!Object} options.render render object
   * @param {!HTMLElement} options.render.element render element
   * @param {!Object} options.render.transform hash of CSS style properties to animate
   * @param {!Object} options.render.animateOptions animation options
   * @return {undefined}
   */
  drawRender: function drawRender(render) {
    var self = this;

    validate(render, "render", { isRequired: true });
    validate(render.element, "render.element", { isElement: true });

    console.warn("Viewport#drawRender %s %s - %s", render.item.id, render.id, render.isAnimating, render);
    if (render.isAnimating) {
      self.stopRenderAnimation(render);
    }

    render.isAnimating = true;
    self.renderAnimationCount++;
    self.setDefaultRenderAnimateOptions(render);
    self.setRender(render);
    self.canvas.addRender(render);

    if (self.config.debugDrawing) {
      console.log("%cViewport#drawRender: %s render (animations %d)",
        logger.GREEN_BG,
        render.isErasing ? "erasing" : "drawing",
        self.renderAnimationCount,
        render.item.id,
        render.id);
    }

    _.defer(function() {
      self.animator.animate({
        elements: render.element,
        properties: render.transform,
        options: render.animateOptions
      });
    });
  },

  /**
   * Draws the specified renders for the given Item.
   *
   * The Layout getRenders method does not specify an element in the render object, because the Layout
   * has no knowledge of elements - it merely provides the transform and animateOptions that it wants to
   * apply the the element(s) for an Item.  The Viewport keeps track of the Items and renders in a tree data
   * structure.  When new renders are retrieved from teh Layout, this method will merge the new renders
   * with any existing renders, add new elements where needed, and mark other elements for removal, and applies
   * the new render transforms for any existing elements.
   *
   * @param {!Item} item Item for which to draw renders
   * @param {!Object} renders keyed object of renders to draw for the item
   * @return {undefined}
   */
  drawRenders: function drawRenders(item, renders) {
    validate(item, "item", { isInstanceOf: Item });
    validate(renders, "renders", { isPlainObject: true });

    var newRenderIds = _.keys(renders);
    var previousRenders = this.getRenders(item);
    var previousRenderIds = _.keys(previousRenders);
    var renderIdsToMerge = _.intersection(previousRenderIds, newRenderIds); // renders that existed before, and exist in new set
    var renderIdsToRemove = _.difference(previousRenderIds, renderIdsToMerge); // renders that existed before, but don't exist in new set
    var renderIdsToAdd = _.difference(newRenderIds, renderIdsToMerge); // renders that did not exist before, but exist in new set

    /*
    if (this.config.debugDrawing) {
      console.log("Viewport#drawRenders: drawing/erasing renders for item", JSON.stringify({
        item: item.id,
        prevIds: previousRenderIds,
        newIds: newRenderIds,
        mergeIds: renderIdsToMerge,
        removeIds: renderIdsToRemove,
        addIds: renderIdsToAdd
      }));
    }
    */

    _.each(renderIdsToMerge, function(renderId) {
      var previousRender = previousRenders[renderId];
      var newRender = renders[renderId];
      var mergedRender = _.merge({}, previousRender, newRender);

      // If the transform is the same for the render, don't actually do the animation,
      // but fake it as if it happened, so we can still rely on the normal render cycle
      // completion logic (like detecting when all items have been processed, even if none
      // of them have changed.
      if (_.isEqual(previousRender.transform, mergedRender.transform)) {
        if (this.config.debugDrawing) {
          console.info("Viewport#drawRenders: not animating item render (no change to transform)", item.id, mergedRender.id);
        }
        return;
      }

      this.drawRender(mergedRender);
    }, this);

    _.each(renderIdsToAdd, function(renderId) {
      var newRender = renders[renderId];
      newRender.element = this.createRenderElement(item, newRender);
      this.initializeRender(newRender);
      this.drawRender(newRender);
    }, this);

    _.each(renderIdsToRemove, function(renderId) {
      var previousRender = previousRenders[renderId];
      this.eraseRender(previousRender);
    }, this);
  },

  /**
   * Starts the erasing process for a render.  The erasing or hiding of a render is animated, and the actual
   * removal of the render is done after the animation completes.
   *
   * @param {!Object} render render to remove
   * @param {?Object} options additional options
   * @return {undefined}
   */
  eraseRender: function eraseRender(render) {
    validate(render, "render", { isRequired: true });

    if (render.isErasing) {
      return;
    }

    render.isErasing = true;
    this.layout.setHideAnimation(render, this.layoutMethodOptions);
    this.drawRender(render);
  },

  /**
   * Removes all the renders for an item, or all renders if no item is specified
   *
   * @param {?Item} item - item from which to remove all renders, or undefined to remove all renders
   * @param {?Number} index index of item, if known
   * @param {?Object} options additional options
   * @return {undefined}
   */
  eraseRenders: function eraseRenders(item) {
    var renders = this.getRenders(item);

    if (!renders || _.isEmpty(renders)) {
      return;
    }

    /*
    if (this.config.debugDrawing) {
      console.log("Viewport#eraseRenders: erasing renders (length %d)", _.keys(renders).length);
    }
    */

    _.each(renders, function(render) {
      this.eraseRender(render);
    }, this);
  },

  /**
   * Removes the given render from the Viewport's internal items/renders data structure.
   *
   * This is called automatically after a render has been erased (after the erase animation).
   * This should not be called directly.
   *
   * @param {!Object} render render to remove
   * @return {undefined}
   */
  removeRender: function removeRender(render) {
    validate(render, "render", { isRequired: true });

    /*
    if (this.config.debugDrawing) {
      console.log("Viewport#removeRender: removing render", render.item.id, render.id);
    }
    */

    var renders = this.getRenders(render.item);
    delete renders[render.id];

    this.canvas.removeRender(render);
  },

  cleanErasedRendersAndItems: function cleanErased() {
    // Remove all renders and items that have been successfully erased
    _.each(this.getRenders(), function(render) {
      if (render.isErasing) {
        this.removeRender(render);

        if (render.item.isErasing && !this.hasRenders(render.item)) {
          this.removeItem(render.item);
        }
      }
    }, this);
  },

  /**
   * Gets the default animation options, extended with the options.render.animateOptions
   *
   * @param {!Object} options object to pass to callback methods, like complete
   * @return {Object} hash of animation options
   */
  setDefaultRenderAnimateOptions: function setDefaultRenderAnimateOptions(render) {
    var self = this;

    validate(render, "render", { isRequired: true });

    render.animateOptions = render.animateOptions || {};

    render.animateOptions.complete = function() {
      self.onRenderAnimationComplete(render);
    };

    render.animateOptions.queue = false;
  },

  /**
   * Creates a container element for an individual render
   *
   * @return {HTMLElement} detached DOM element which will become the container for a render element.
   */
  createRenderElement: function createRenderElement(item, render) {
    validate(item, "item", { isInstanceOf: Item });
    validate(render, "render", { isRequired: true });

    /*
    if (this.config.debugDrawing) {
      console.log("Viewport#createRenderElement: creating element for render", render.item.id, render.id);
    }
    */

    var element = dom.create("div");
    element.id = this.config.itemClassName + "-" + item.id + "-" + render.id;
    dom.addClass(element, this.config.itemClassName);
    dom.setStyle(element, "position", "absolute");
    dom.setStyle(element, "top", 0);
    dom.setStyle(element, "left", 0);
    dom.setAttr(element, "data-item-id", item.id);
    dom.setAttr(element, "data-render-id", render.id);

    return element;
  },

  /**
   * Called when a new element is created for use as a render.  This gives the {@link Layout}
   * the opportunity to customize the initial state of the render.  If an element already exists for
   * a previous render, and the element will be re-used for a transition, this method is not called.
   */
  initializeRender: function initializeRender(render) {
    if (this.config.debugLoading) {
      console.log("Viewport#initializeRender: initializing render", render.item.id, render.id);
    }

    validate(render, "render", { isRequired: true });

    this.layout.initializeRender(render, this.layoutMethodOptions);
  },

  /**
   * Delegates to the Layout instance to load the render contents.
   *
   * @param {!Object} render - render to load
   * @return {undefined}
   */
  loadRender: function loadRender(render) {
    if (this.config.debugLoading) {
      console.log("Viewport#loadRender: loading render", render.item.id, render.id);
    }

    validate(render, "render", { isRequired: true });

    this.layout.loadRender(render, this.layoutMethodOptions);
  },

  /**
   * Delegates to the layout instance to unload the render contents.
   *
   * @param {!Object} render - render to unload
   * @return {undefined}
   */
  unloadRender: function unloadRender(render) {
    if (this.config.debugLoading) {
      console.log("Viewport#unloadRender: unloading render", render.item.id, render.id);
    }

    validate(render, "render", { isRequired: true });

    this.layout.unloadRender(render, this.layoutMethodOptions);
  },

  /**
   * Returns a boolean indicating whether this render should be loaded at this time.
   *
   * The {@link Layout} can implement a method "shouldLoadRender" to specifiy whether
   * any given render should be loaded.
   *
   * If the {@link Layout#shouldLoadRender} method returns false, the {@link Viewport}
   * will call the {@link Layout#shouldUnloadRender} method to see if the render should
   * be unloaded.
   *
   * @param {!Object} render - render to check whether it needs to be loaded
   * @return {boolean}
   */
  shouldLoadRender: function shouldLoadRender(render) {
    validate(render, "render", { isRequired: true });

    return this.layout.shouldLoadRender(render, this.layoutMethodOptions);
  },

  /**
   * Returns a boolean indicating whether this render should be unloaded at this time.
   *
   * The {@link Layout} can implement a method "shouldUnloadRender" to specifiy whether
   * any given render should be loaded.
   *
   * {@link Layout#shouldUnloadRender} is only called if {@link Layout#shouldLoadRender} returns
   * false;
   *
   * @param {!Object} render - render to check whether it needs to be loaded
   * @return {boolean}
   */
  shouldUnloadRender: function shouldUnloadRender(render) {
    validate(render, "render", { isRequired: true });

    return this.layout.shouldUnloadRender(render, this.layoutMethodOptions);
  },

  /**
   * Loads or unloads a render depending on factors like whether its visible in the
   * frame element, etc.
   *
   * @param {!Object} render render to load or unload
   * @return {undefined}
   */
  loadOrUnloadRender: function loadOrUnloadRender(render) {
    if (this.shouldLoadRender(render)) {
      this.loadRender(render);
    } else if (this.shouldUnloadRender(render)) {
      this.unloadRender(render);
    }
  },

  /**
   * Loads or unloads all the renders managed by the Viewport.
   *
   * @return {undefined}
   */
  loadOrUnloadRenders: function loadOrUnloadRenders() {
    if (this.config.debugLoading) {
      console.log("Viewport#loadOrUnloadRenders: loading or unloading renders");
    }

    _.each(this.getRenders(), function(render) {
      this.loadOrUnloadRender(render);
    }, this);
  },

  /**
   * Stops the animation for a render.
   *
   * @param render
   * @return {undefined}
   */
  stopRenderAnimation: function stopRenderAnimation(render) {
    if (!this.useAnimationStopping) {
      return;
    }

    validate(render, "Viewport#stopRenderAnimation: render", { isRequired: true });

    if (this.config.debugDrawing) {
      console.log("%cStopping animation for render", logger.RED_BG, render.item.id, render.id);
    }

    this.animator.animate(render.element, "stop", true);

    //render.isAnimating = false;
    //this.renderAnimationCount--;
  },

  /**
   * Gets the custom renders
   *
   * @return {undefined}
   */
  getCustomRenders: function getCustomRenders() {
    return this.customRenders;
  },

  /**
   * Gets a custom render by id
   *
   * @param id
   * @return {undefined}
   */
  getCustomRender: function getCustomRender(id) {
    return this.customRenders[id];
  },

  /**
   * Sets a custom render in the internal data structure
   *
   * @param customRender
   * @return {undefined}
   */
  setCustomRender: function setCustomRender(customRender) {
    validate(customRender, "customRender", { isRequired: true });

    this.customRenders[customRender.id] = customRender;
  },

  /**
   * Removes a custom render from the internal data structure.
   *
   * @param customRender
   * @return {undefined}
   */
  removeCustomRender: function removeCustomRender(customRender) {
    validate(customRender, "customRender", { isRequired: true });

    delete this.customRenders[customRender.id];
    this.canvas.removeRender(customRender);
  },

  /**
   * Indicates if there are any custom renders.
   *
   * @return {undefined}
   */
  hasCustomRenders: function hasCustomRenders() {
    return !_.isEmpty(this.customRenders);
  },

  /**
   * Draws a custom render by initiating its animation.
   *
   * @param customRender
   * @return {undefined}
   */
  drawCustomRender: function drawCustomRender(customRender) {
    var self = this;

    validate(customRender, "customRender", { isRequired: true });
    validate(customRender.element, "customRender.element", { isElement: true });

    customRender.isAnimating = true;
    self.customRenderAnimationCount++;
    self.setDefaultCustomRenderAnimateOptions(customRender);
    self.setCustomRender(customRender);
    self.canvas.addRender(customRender);

    if (self.config.debugDrawing) {
      console.log("%cViewport#drawCustomRender: %s custom render (animations %d)",
        logger.GREEN_FG,
        customRender.isErasing ? "erasing" : "drawing",
        self.customRenderAnimationCount,
        customRender.id);
    }

    _.defer(function() {
      self.animator.animate({
        elements: customRender.element,
        properties: customRender.transform,
        options: customRender.animateOptions
      });
    });
  },

  /**
   * Calls the {@link Layout} to get custom renders, and initiates the drawing cycle for all of them.
   *
   * @return {undefined}
   */
  drawCustomRenders: function drawCustomRenders() {
    /*
    if (this.config.debugDrawing) {
      console.log("Viewport#drawCustomRenders: drawing custom renders");
    }
    */

    var layoutCustomRenders = this.layout.getCustomRenders(this.layoutMethodOptions);

    if (!layoutCustomRenders || _.isEmpty(layoutCustomRenders)) {
      return;
    }

    if (!_.isArray(layoutCustomRenders)) {
      layoutCustomRenders = [layoutCustomRenders];
    }

    var customRenders = {};

    _.each(layoutCustomRenders, function(customRender, index) {
      validate(customRender.element, "Viewport#drawCustomRenders: customRender.element", { isElement: true });
      customRender.id = customRender.element.id || ("" + _.uniqueId());
      customRender.index = index;
      customRenders[customRender.id] = customRender;
      this.drawCustomRender(customRender);
    }, this);
  },

  /**
   * Marks a custom render as needing to be erased, and starts the erase animation.
   *
   * @param customRender
   * @return {undefined}
   */
  eraseCustomRender: function eraseCustomRender(customRender) {
    validate(customRender, "customRender", { isRequired: true });

    if (customRender.isErasing) {
      return;
    }

    customRender.isErasing = true;
    this.layout.setHideAnimation(customRender, this.layoutMethodOptions);
    this.drawCustomRender(customRender);
  },

  /**
   * Erases all the custom renders.
   *
   * @return {undefined}
   */
  eraseCustomRenders: function eraseCustomRenders() {
    if (this.config.debugDrawing) {
      console.log("Viewport#eraseCustomRenders: erasing custom renders (length %d)", _.keys(this.getCustomRenders()).length);
    }

    _.each(this.getCustomRenders(), function(customRender) {
      this.eraseCustomRender(customRender);
    }, this);
  },

  cleanErasedCustomRenders: function cleanErasedCustomRenders() {
    _.each(this.customRenders, function(customRender) {
      if (customRender.isErasing) {
        this.canvas.removeRender(customRender);
      }
    }, this);
  },

  /**
   * Sets the default animation options for a custom render animation.
   *
   * @param customRender
   * @return {undefined}
   */
  setDefaultCustomRenderAnimateOptions: function setDefaultCustomRenderAnimateOptions(customRender) {
    var self = this;

    validate(customRender, "customRender", { isRequired: true });

    customRender.animateOptions = customRender.animateOptions || {};

    customRender.animateOptions.complete = function() {
      self.onCustomRenderAnimationComplete(customRender);
    };
  },

  /**
   * Helper function for creating a custom render element with a default position.
   *
   * @param customRender
   * @return {undefined}
   */
  createCustomRenderElement: function createCustomRenderElement() {
    var element = dom.create("div");
    element.id = this.config.customRenderClassName + "-" + _.uniqueId();
    dom.addClass(element, this.config.customRenderClassName);
    dom.setStyle(element, "position", "absolute");
    dom.setStyle(element, "top", 0);
    dom.setStyle(element, "left", 0);
    return element;
  },

  /**
   * Pans the {@link Canvas} to the {@link Item}'s render element specified by renderIdOrIndex.
   *
   * @param {!Item} item - item to pan to
   * @param {?(string|number)} [renderIdOrIndex=0] - render id or index to pan to
   * @return {undefined}
   */
  panToItem: function panToItem(item, renderIdOrIndex) {
    validate(item, "Viewport#panToItem: item", { isInstanceOf: Item });

    var render = this.getRender(item, renderIdOrIndex);

    validate(render, "Viewport#panToItem: render", { isRequired: true });
    validate(render.element, "Viewport#panToItem: render.element", { isRequired: true });

    this.canvas.panToElement(render.element);
  },

  /**
   * Configures gestures for a single render.
   *
   * @param render
   * @return {undefined}
   */
  configureRenderGestures: function configureRenderGestures(render) {
    if (render.isErasing) {
      this.removeRenderGestureHandler(render);
    } else {
      this.addRenderGestureHandler(render);
    }
  },

  /**
   * Configures gestures for all renders
   *
   * @return {undefined}
   */
  configureAllRenderGestures: function() {
    if (this.config.debugGestures) {
      console.log("Viewport#configureAllRenderGestures: configuring all render gestures");
    }

    var renders = this.getRenders();

    _.each(renders, function(render) {
      this.configureRenderGestures(render);
    }, this);
  },

  /**
   * Destroys gestures for all renders.
   *
   * @return {undefined}
   */
  destroyRenderGestures: function() {
    if (this.config.debugGestures) {
      console.log("Viewport#destroyRenderGestures: destroying all render gestures");
    }

    _.each(this.gestureHandlerGroups, function(gestureHandlerGroup) {
      gestureHandlerGroup.destroy();
    }, this);

    // Clear the gesture handler group id off all renders
    _.each(this.getRenders(), function(render) {
      delete render.gestureHandlerGroupId;
    });

    this.gestureHandlerGroups = {};
  },

  /**
   * Adds a {@link GestureHandler} for the render, and puts it in a {@link GestureHandlerGroup}
   * according to the render.gestureHandlerGroupId.
   *
   * @param render
   * @return {undefined}
   */
  addRenderGestureHandler: function addRenderGestureHandler(render) {
    var gestureHandlerGroupId = render.gestureHandlerGroupId;

    if (!gestureHandlerGroupId) {
      return;
    }

    // Get the GestureHandlerGroup options from the Layout
    var layoutGestureHandlerOptions = this.layout.getRenderGestureOptions(render, this.layoutMethodOptions);

    // Create the GestureHandlerGroup if it doesn't exist
    if (!this.gestureHandlerGroups[gestureHandlerGroupId]) {
      var defaultGestureHandlerGroupOptions = {
        config: this.config,
        emitter: this.emitter,
        containerElement: this.canvas.element
      };

      var gestureHandlerGroupOptions = _.extend(defaultGestureHandlerGroupOptions, layoutGestureHandlerOptions);

      this.gestureHandlerGroups[gestureHandlerGroupId] = new GestureHandlerGroup(gestureHandlerGroupOptions);
    }

    // Get a reference to the group
    var gestureHandlerGroup = this.gestureHandlerGroups[gestureHandlerGroupId];

    // If the element is already in the group, bail
    if (gestureHandlerGroup.hasGestureHandlerForElement(render.element)) {
      return;
    }

    // Create the GestureHandler to add to the GestureHandlerGroup
    var defaultGestureHandlerOptions = {
      animator: this.animator,
      config: this.config,
      emitter: this.emitter,
      element: render.element,
      bounds: this.frame.bounds,
      snapping: {
        toBounds: false,
        hardStopAtBounds: true,
        reduceMovementAtBounds: false,
        toNearestChildElement: false
      }
    };

    var gestureHandlerOptions = _.merge(defaultGestureHandlerOptions, layoutGestureHandlerOptions);

    var gestureHandler = new GestureHandler(gestureHandlerOptions);

    if (this.config.debugGestures) {
      console.log("Viewport#addRenderGestureHandler: adding gesture handler", gestureHandlerGroupId, render);
    }

    gestureHandlerGroup.addGestureHandler(gestureHandler);
  },

  /**
   * Removes the {@link GestureHandler} for a render.
   *
   * @param render
   * @return {undefined}
   */
  removeRenderGestureHandler: function removeRenderGestureHandler(render) {
    var gestureHandlerGroupId = render.gestureHandlerGroupId;

    if (!gestureHandlerGroupId) {
      // No gesture handler group id specified
      return;
    }

    if (!this.gestureHandlerGroups[gestureHandlerGroupId]) {
      // No gesture handler group exists for this id
      return;
    }

    var gestureHandlerGroup = this.gestureHandlerGroups[gestureHandlerGroupId];

    if (this.config.debugGestures) {
      console.log("Viewport#removeRenderGestureHandler: removing gesture handler", gestureHandlerGroupId, render);
    }

    gestureHandlerGroup.removeGestureHandlerForElement(render.element);
  },


  /**
   * Called when the {@link Deck} is ready.  Triggers a draw/load cycle.
   *
   * This draw cycle can be prevented from happening by setting the drawOnDeckReady to false in the
   * {@link Viewport} options.
   *
   * @return {undefined}
   */
  onDeckReady: function onDeckReady() {
    if (this.config.debugDrawing) {
      console.log("Viewport#onDeckReady");
    }

    this.isDeckReady = true;

    if (!this.canDraw(this.drawOnDeckReady)) {
      return;
    }

    this.drawItems();
  },

  /**
   * Called when a draw request is made on the {@link Deck}.  Triggers a redraw/reload cycle.
   *
   * @return {undefined}
   */
  onDeckDraw: function onDeckDraw() {
    if (this.config.debugDrawing) {
      console.log("Viewport#onDeckDraw");
    }

    if (!this.canDraw()) {
      return;
    }

    this.eraseCustomRenders();

    this.drawItems();
  },

  /**
   * Called before the {@link Deck} {@link Layout} is about to be set.
   *
   * @return {undefined}
   */
  onDeckLayoutSetting: function onDeckLayoutSetting() {
    if (this.config.debugDrawing) {
      console.log("Viewport#onDeckLayoutSetting");
    }

    if (!this.canDraw()) {
      return;
    }

    this.eraseCustomRenders();

    this.destroyRenderGestures();
  },

  /**
   * Called when a new layout is set on the {@link Deck}.  Triggers a redraw/reload cycle.
   *
   * @return {undefined}
   */
  onDeckLayoutSet: function onDeckLayoutSet(e) {
    if (this.config.debugDrawing) {
      console.log("Viewport#onDeckLayoutSet");
    }

    var layout = e.data;

    this.setLayout(layout);

    if (!this.canDraw()) {
      return;
    }

    this.drawItems();
  },

  /**
   * Called before the {@link Frame} bounds are about to be set.
   *
   * @return {undefined}
   */
  onFrameBoundsSetting: function onFrameBoundsSetting() {
    if (this.config.debugDrawing) {
      console.log("Viewport#onFrameBoundsSetting");
    }

    if (!this.canDraw()) {
      return;
    }

    this.eraseCustomRenders();
  },

  /**
   * Called when the {@link Frame} bounds are set.  Triggers a redraw cycle.
   *
   * @return {undefined}
   */
  onFrameBoundsSet: function onFrameBoundsSet() {
    if (this.config.debugDrawing) {
      console.log("Viewport#onFrameBoundsSet");
    }

    if (!this.canDraw()) {
      return;
    }

    this.drawItems();
  },

  /**
   * Called when an {@link Item} is changed
   *
   * @param e
   * @return {undefined}
   */
  onItemChanged: function onItemChanged(e) {
    if (this.config.debugDrawing) {
      console.log("Viewport#onItemChanged");
    }

    if (!this.canDraw()) {
      return;
    }

    var item = e.sender;

    this.eraseCustomRenders();

    this.drawItem(item);
  },

  onItemCollectionItemAdding: function onItemCollectionItemAdding() {
    if (this.config.debugDrawing) {
      console.log("Viewport#onItemCollectionItemAdding");
    }

    if (!this.canDraw()) {
      return;
    }

    this.eraseCustomRenders();
  },

  onItemCollectionItemAdded: function onItemCollectionItemAdded() {
    if (this.config.debugDrawing) {
      console.log("Viewport#onItemCollectionItemAdded");
    }

    if (!this.canDraw()) {
      return;
    }

    this.drawItems();
  },

  onItemCollectionItemsAdding: function onItemCollectionItemAdding() {
    if (this.config.debugDrawing) {
      console.log("Viewport#onItemCollectionItemAdding");
    }

    if (!this.canDraw()) {
      return;
    }

    this.eraseCustomRenders();
  },

  onItemCollectionItemsAdded: function onItemCollectionItemAdded() {
    if (this.config.debugDrawing) {
      console.log("Viewport#onItemCollectionItemsAdded");
    }

    if (!this.canDraw()) {
      return;
    }

    this.drawItems();
  },

  onItemCollectionItemRemoving: function onItemCollectionItemRemoving() {
    if (this.config.debugDrawing) {
      console.log("Viewport#onItemCollectionItemRemoving");
    }

    if (!this.canDraw()) {
      return;
    }

    this.eraseCustomRenders();
  },

  onItemCollectionItemRemoved: function onItemCollectionItemRemoved(e) {
    if (this.config.debugDrawing) {
      console.log("Viewport#onItemCollectionItemRemoved");
    }

    if (!this.canDraw()) {
      return;
    }

    var item = e.data;

    // Start the erase animations for all the renders for the item that was removed
    this.eraseItem(item);

    // Re-draw all the other items - this is needed because the removal of an item might
    // require other items to be re-drawn too.
    // The Item is already removed from the ItemCollection when this is called, so re-draw all the other
    // Items
    this.drawItems();
  },

  onItemCollectionClearing: function onItemCollectionClearing() {
    if (this.config.debugDrawing) {
      console.log("Viewport#onItemCollectionClearing");
    }

    if (!this.canDraw()) {
      return;
    }

    this.eraseCustomRenders();
  },

  onItemCollectionCleared: function onItemCollectionCleared(e) {
    if (this.config.debugDrawing) {
      console.log("Viewport#onItemCollectionCleared");
    }

    if (!this.canDraw()) {
      return;
    }

    var items = e.data;

    this.eraseItems(items);
  },

  onItemCollectionFilterSetting: function() {
    if (this.config.debugDrawing) {
      console.log("Viewport#onItemCollectionFilterSetting");
    }

    if (!this.canDraw()) {
      return;
    }

    this.destroyRenderGestures();
  },

  onItemCollectionSortBySetting: function() {
    if (this.config.debugDrawing) {
      console.log("Viewport#onItemCollectionSortBySetting");
    }

    if (!this.canDraw()) {
      return;
    }

    this.destroyRenderGestures();
  },

  onItemCollectionReversedSetting: function() {
    if (this.config.debugDrawing) {
      console.log("Viewport#onItemCollectionReversedSetting");
    }

    if (!this.canDraw()) {
      return;
    }

    this.destroyRenderGestures();
  },

  onItemCollectionIndexing: function onItemCollectionIndexing() {
    if (this.config.debugDrawing) {
      console.log("Viewport#onItemCollectionIndexing");
    }

    if (!this.canDraw()) {
      return;
    }

    this.eraseCustomRenders();
  },

  onItemCollectionIndexed: function onItemCollectionIndexed(e) {
    if (this.config.debugDrawing) {
      console.log("Viewport#onItemCollectionIndexed");
    }

    if (!this.canDraw()) {
      return;
    }

    var stats = e.data;

    if (stats.reason.isSetFilter || stats.reason.isSetSortBy || stats.reason.isSetReversed) {
      this.drawItems({ loadNeeded: false });

      if (stats.totalCount === 0 || stats.changedCount === 0) {
        this.drawCustomRenders();
      }
    }
  },

  /**
   * Called when an individual render animation completes.
   *
   * This updates the render data in the internal data structure, or removes the render if it was being
   * erased.  It also checks for the completion of a full render cycle, which might trigger additional events.
   *
   * @param render
   * @return {undefined}
   */
  onRenderAnimationComplete: function onRenderAnimationComplete(render) {
    validate(render, "Viewport#onRenderAnimationComplete: render", { isRequired: true });

    render.isAnimating = false;
    this.renderAnimationCount--;

    if (this.config.debugDrawing) {
      console.log(
        "%cViewport#onRenderAnimationComplete: render %s complete (animations %d)",
        logger.BLUE_BG,
        render.isErasing ? "erasing" : "drawing",
        this.renderAnimationCount,
        render.item.id,
        render.id);
    }

    if (this.renderAnimationCount === 0) {
      this.onAllRenderAnimationsComplete();
    }
  },

  /**
   * Called when all the animations in a render cycle have been completed.
   *
   * @return {undefined}
   */
  onAllRenderAnimationsComplete: function onAllRenderAnimationsComplete() {
    var self = this;

    if (self.config.debugDrawing) {
      console.log("Viewport#onAllRenderAnimationsComplete: all render animations complete");
    }

    _.defer(function() {
      self.emit(DecksEvent("viewport:all:renders:drawn", self));

      _.defer(function() {
        self.drawCustomRenders();

        _.defer(function() {
          self.loadOrUnloadRenders();

          _.defer(function() {
            self.configureAllRenderGestures();

            _.defer(function() {
              self.cleanErasedRendersAndItems();
            });
          });
        });
      });
    });
  },

  /**
   * Called when a custom render animation completes.  Adds the custom render to the internal data structure,
   * or removes it if the custom render was being erased.
   *
   * This also checks for the end of the drawing cycle for all custom renders, and may perform additional
   * logic at the end of the cycle.
   *
   * @param customRender
   * @return {undefined}
   */
  onCustomRenderAnimationComplete: function onCustomRenderAnimationComplete(customRender) {
    validate(customRender, "Viewport#onCustomRenderAnimationComplete: customRender", { isRequired: true });

    customRender.isAnimating = false;
    this.customRenderAnimationCount--;

    if (this.config.debugDrawing) {
      console.log(
        "%cViewport#onCustomRenderAnimationComplete: custom render animation complete (animations %s)",
        logger.BLUE_FG,
        this.customRenderAnimationCount,
        customRender.id);
    }

    if (this.customRenderAnimationCount === 0) {
      this.onAllCustomRenderAnimationsComplete();
    }
  },

  /**
   * Called when all the custom render animations have been completed.
   *
   * @return {undefined}
   */
  onAllCustomRenderAnimationsComplete: function onAllCustomRenderAnimationsComplete() {
    var self = this;

    if (this.config.debugDrawing) {
      console.log("Viewport#onAllCustomRenderAnimationsComplete: all custom render animations complete");
    }

    _.defer(function() {
      self.emit(DecksEvent("viewport:all:custom:renders:drawn", self));

      _.defer(function() {
        self.cleanErasedCustomRenders();
      });
    });
  },

  /**
   * Called when an element is moved via a gesture.
   *
   * @param e
   * @return {undefined}
   */
  onGestureElementMoved: function onGestureElementMoved(/*e*/) {
    this.debouncedLoadOrUnloadRenders();
  },

  /**
   * Called when the {@link Canvas} element is moved via a touch gesture, or scrolled.
   *
   * @return {undefined}
   */
  onCanvasElementMoved: function onCanvasElementMoved() {
    this.debouncedLoadOrUnloadRenders();
  },


  /**
   * Called when a render element is moved (e.g. row layout where rows scroll independently)
   *
   * @return {undefined}
   */
  onRenderElementMoved: function onRenderElementMoved() {
    this.debouncedLoadOrUnloadRenders();
  }
});

module.exports = Viewport;
