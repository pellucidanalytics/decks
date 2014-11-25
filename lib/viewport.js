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
var raf = require("raf");

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

  /**
   * Wait time for debounced loadOrUnloadRenders method
   */
  this.debouncedLoadOrUnloadRendersWait = options.debouncedLoadOrUnloadRendersWait;

  /**
   * Wait time for debounced drawItems method
   */
  this.debouncedDrawItemsWait = options.debouncedDrawItemsWait;

  /**
   * Whether to use animation slots
   */
  this.useAnimationSlots = options.useAnimationSlots;

  /**
   * Number of items to animate per animation slot
   */
  this.itemsPerRenderSlot = options.itemsPerRenderSlot;

  /**
   * Max number of animation slots that will be animated in one animation cycle.
   */
  this.maxSlotsWithAnimations = options.maxSlotsWithAnimations;

  /**
   * Delay value for each successive animation slot
   */
  this.slotRenderDelay = options.slotRenderDelay;

  /**
   * Debounced version of {@link Viewport#loadOrUnloadRenders}
   */
  this.debouncedLoadOrUnloadRenders = _.debounce(_.bind(this.loadOrUnloadRenders, this), this.debouncedLoadOrUnloadRendersWait);

  /**
   * Debounced version of {@link Viewport#drawItems}
   */
  this.debouncedDrawItems = _.debounce(_.bind(this.drawItems, this), this.debouncedDrawItemsWait);

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

  /**
   * Keeps track of how many renders are currently being drawn
   */
  this.rendersDrawingCount = 0;

  /**
   * Keeps track of the number of custom renders being drawn
   */
  this.customRendersDrawingCount = 0;

  /**
   * Flag that indicates if the deck is ready.  Drawing actions are suppressed
   * until the deck is signaled as ready
   */
  this.isDeckReady = false;

  /**
   * Object of properties to pass to all {@link Layout} methods invoked by the {@link Viewport}
   * This is to provide the {@link Layout} methods with more context for their logic.
   */
  this.layoutMethodOptions = {
    viewport: this
  };

  this.setAnimator(options.animator);
  this.setConfig(options.config);
  this.setEmitter(options.emitter, this.emitterEvents);
  this.setItemCollection(options.itemCollection);
  this.setLayout(options.layout);
  this.setFrame(options.frame);
  this.setCanvas(options.canvas);

  // Optionally use animation slots for drawing renders (better performance at the expense of number
  // of animations allowed.
  if (this.useAnimationSlots) {
    if (this.config.debugDrawing) {
      console.info("Viewport#constructor: using animation slots");
    }
    this.drawRender = this.drawRenderWithAnimationSlots;
  }
}

_.extend(Viewport.prototype, binder, hasEmitter, /** @lends Viewport.prototype */ {
  /**
   * Default options for instances of Viewport
   */
  defaultOptions: {
    debouncedLoadOrUnloadRendersWait: 1000,
    debouncedDrawItemsWait: 1000,
    allRendersDrawnEventDelay: 2500,
    useAnimationSlots: false, /* Whether to forcefully run animations in small, staggered slots */
    itemsPerRenderSlot: 15, /* number of items created and animated in each rendering slot */
    maxSlotsWithAnimations: 3, /* animations are applied for total items = itemsPerRenderSlot * maxSlotsWithAnimations */
    slotRenderDelay: 100 /* delay between each render slot */
  },

  /**
   * Event to method mapping for binding to the decks emitter.
   */
  emitterEvents: {
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
    "item:index:changed": "onItemIndexChanged",

    // ItemCollection
    "item:collection:item:adding": "onItemCollectionItemAdding",
    "item:collection:item:added": "onItemCollectionItemAdded",
    "item:collection:item:removing": "onItemCollectionItemRemoving",
    "item:collection:item:removed": "onItemCollectionItemRemoved",
    "item:collection:clearing": "onItemCollectionClearing",
    "item:collection:cleared": "onItemCollectionCleared",
    "item:collection:indexing": "onItemCollectionIndexing",
    "item:collection:indexed": "onItemCollectionIndexed",

    // Gestures
    "gesture:element:moved": "onGestureElementMoved"
  },

  /**
   * Sets the animator instance
   *
   * @param animator
   * @return {undefined}
   */
  setAnimator: function(animator) {
    validate(animator, "animator", { isPlainObject: true, isNotSet: this.animate });
    this.animator = this.layoutMethodOptions.animator = animator;
  },

  /**
   * Sets the configuration object
   *
   * @param config
   * @return {undefined}
   */
  setConfig: function(config) {
    validate(config, "config", { isPlainObject: true, isNotSet: this.config });
    this.config = this.layoutMethodOptions.config = config;
  },

  /**
   * Sets the {@link ItemCollection} instance
   *
   * @param itemCollection
   * @return {undefined}
   */
  setItemCollection: function(itemCollection) {
    validate(itemCollection, "itemCollection", { isInstanceOf: ItemCollection, isNotSet: this.itemCollection });
    this.itemCollection = this.layoutMethodOptions.itemCollection = itemCollection;
  },

  /**
   * Sets the {@link Layout} instance
   *
   * @param layout
   * @return {undefined}
   */
  setLayout: function(layout) {
    validate(layout, "layout", { isInstanceOf: Layout });
    this.layout = this.layoutMethodOptions.layout = layout;
  },

  /**
   * Sets the {@link Frame} instance
   *
   * @param frame
   * @return {undefined}
   */
  setFrame: function(frame) {
    validate(frame, "frame", { isInstanceOf: Frame, isNotSet: this.frame });
    this.frame = this.layoutMethodOptions.frame = frame;
  },

  /**
   * Sets the {@link Canvas} instance
   *
   * @param canvas
   * @return {undefined}
   */
  setCanvas: function(canvas) {
    validate(canvas, "canvas", { isInstanceOf: Canvas, isNotSet: this.canvas });
    this.canvas = this.layoutMethodOptions.canvas = canvas;
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
   * @param {boolean} options.isLoadNeeded - indicates if the item should be re-loaded after the animation completes.
   * @return {undefined}
   */
  drawItem: function(item, options) {
    validate(item, "item", { isInstanceOf: Item });

    if (!this.isDeckReady) {
      if (this.config.debugDrawing) {
        console.warn("Viewport#drawItem: not drawing item - deck is not ready", item);
      }
      return;
    }

    var layoutRenders = this.layout.getRenders(item, this.layoutMethodOptions) || [];

    if (!_.isArray(layoutRenders)) {
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
      if (options) {
        render.isLoadNeeded = !!options.isLoadNeeded;
      }

      renders[render.id] = render;
    });

    this.drawRenders(item, renders);
  },

  /**
   * Starts the drawing process for all Items in the ItemCollection.
   *
   * @return {undefined}
   */
  drawItems: function(options) {
    var items = this.itemCollection.getItems();

    if (items.length === 0) {
      return;
    }

    _.each(items, function(item) {
      this.drawItem(item, options);
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
  eraseItem: function(item) {
    validate(item, "item", { isInstanceOf: Item });
    item.isErasing = true;
    this.eraseRenders(item);
  },

  /**
   * Starts the erasing process for all the Items in the ItemCollection.
   *
   * @return {undefined}
   */
  eraseItems: function(items) {
    items = _.isArray(items) ? items : this.itemCollection.getItems();

    if (items.length === 0) {
      return;
    }

    _.each(items, function(item) {
      this.eraseItem(item);
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
  removeItem: function(item) {
    validate(item, "item", { isInstanceOf: Item });
    delete this.renders[item.id];
    this.emit(DecksEvent("viewport:item:erased", this, item));
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
  getRenders: function(item) {
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

  getRender: function(item, renderIdOrIndex) {
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
  hasRenders: function(item) {
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
  setRender: function(render) {
    validate(render, "render", { isRequired: true });

    var renders = this.getRenders(render.item);
    renders[render.id] = render;

    this.emit(DecksEvent("viewport:render:drawn", this, render));
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
  drawRender: function(render) {
    var self = this;
    validate(render, "render", { isRequired: true });

    self.setDefaultRenderAnimateOptions(render);
    self.rendersDrawingCount++;

    if (self.config.debugDrawing) {
      console.log("Viewport#drawRender: renders drawing count: " + self.rendersDrawingCount);
    }

    var eventName = render.isErasing ? "viewport:render:erasing" : "viewport:render:drawing";

    raf(function() {
      self.emit(DecksEvent(eventName, self, render));

      raf(function() {
        if (render.immediateCompleteAnimation) {
          // Simulate animation completion
          render.immediateCompleteAnimation = false;
          self.onRenderAnimationComplete(render);
        } else {
          // Start the animation
          self.animator.animate({
            elements: render.element,
            properties: render.transform,
            options: render.animateOptions
          });
        }
      });
    });
  },

  /**
   * Alternate version of drawRender which forcibly slots out the animations, disables animations
   * after a certain threshold, and staggers small groups of them to gain better animation performance.
   */
  drawRenderWithAnimationSlots: function(render) {
    var self = this;
    validate(render, "render", { isRequired: true });

    self.setDefaultRenderAnimateOptions(render);

    self.rendersDrawingCount++;

    if (self.config.debugDrawing) {
      console.log("Viewport#drawRender: renders drawing count: " + self.rendersDrawingCount);
    }

    var eventName = render.isErasing ? "viewport:render:erasing" : "viewport:render:drawing";

    // stagger the element creation and animation into batches
    var renderSlotIndex = parseInt(self.rendersDrawingCount / this.itemsPerRenderSlot, 10);
    var slotRenderDelay = this.slotRenderDelay;

    // Disable animation if the item falls in later slots
    if (renderSlotIndex >= this.maxSlotsWithAnimations ||
        render.animateOptions.display && render.animateOptions.display === "none") {
      // disable animation
      render.animateOptions.duration = 0;
      render.animateOptions.queue = false;

      // cut the slot render delay by half when there are no animations
      slotRenderDelay = parseInt(slotRenderDelay / 2, 10);
    }

    _.delay(function () {
      raf(function() {
        self.emit(DecksEvent(eventName, self, render));

        raf(function() {
          if (render.immediateCompleteAnimation) {
            // Fake the animation completion
            render.immediateCompleteAnimation = false;
            self.onRenderAnimationComplete(render);
          } else {
            // Start the animation
            self.animator.animate({
              elements: render.element,
              properties: render.transform,
              options: render.animateOptions
            });
          }
        });
      });
    }, renderSlotIndex * slotRenderDelay /* stagger item creation and animation */);
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
  drawRenders: function(item, renders) {
    validate(item, "item", { isInstanceOf: Item });
    validate(renders, "renders", { isPlainObject: true });

    var newRenderIds = _.keys(renders);
    var previousRenders = this.getRenders(item);
    var previousRenderIds = _.keys(previousRenders);
    var renderIdsToMerge = _.intersection(previousRenderIds, newRenderIds); // renders that existed before, and exist in new set
    var renderIdsToRemove = _.difference(previousRenderIds, renderIdsToMerge); // renders that existed before, but don't exist in new set
    var renderIdsToAdd = _.difference(newRenderIds, renderIdsToMerge); // renders that did not exist before, but exist in new set

    if (this.config.debugDrawing) {
      console.log("Viewport#drawRenders: drawing renders for item", JSON.stringify({
        item: item.id,
        previousRenderIds: previousRenderIds,
        newRenderIds: newRenderIds,
        renderIdsToMerge: renderIdsToMerge,
        renderIdsToRemove: renderIdsToRemove,
        renderIdsToAdd: renderIdsToAdd
      }));
    }

    _.each(renderIdsToMerge, function(renderId) {
      var previousRender = previousRenders[renderId];
      var newRender = renders[renderId];
      var mergedRender = _.merge({}, previousRender, newRender);

      // If the transform is the same for the render, don't actually do the animation,
      // but fake it as if it happened, so we can still rely on the normal render cycle
      // completion logic (like detecting when all items have been processed, even if none
      // of them have changed.
      if (_.isEqual(previousRender.transform, mergedRender.transform) && !mergedRender.isLoadNeeded) {
        if (this.config.debugDrawing) {
          console.warn("Viewport#drawRenders: not animating item render (no change to transform)", item, mergedRender);
        }
        mergedRender.immediateCompleteAnimation = true;
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
  eraseRender: function(render) {
    validate(render, "render", { isRequired: true });

    render.isErasing = true;
    this.layout.setHideAnimation(render, this.layoutMethodOptions);

    this.drawRender(render);
  },

  /**
   * Removes all the renders for an item
   *
   * @param {?Item} item - item from which to remove all renders, or undefined to remove all renders
   * @param {?Number} index index of item, if known
   * @param {?Object} options additional options
   * @return {undefined}
   */
  eraseRenders: function(item) {
    _.each(this.getRenders(item), function(render) {
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
  removeRender: function(render) {
    validate(render, "render", { isRequired: true });

    var renders = this.getRenders(render.item);
    delete renders[render.id];

    this.emit(DecksEvent("viewport:render:erased", this, render));
  },

  /**
   * Gets the default animation options, extended with the options.render.animateOptions
   *
   * @param {!Object} options object to pass to callback methods, like complete
   * @return {Object} hash of animation options
   */
  setDefaultRenderAnimateOptions: function(render) {
    var self = this;

    validate(render, "render", { isRequired: true });

    render.animateOptions.complete = function(/*elements*/) {
      self.onRenderAnimationComplete(render);
    };
  },

  /**
   * Creates a container element for an individual render
   *
   * @return {HTMLElement} detached DOM element which will become the container for a render element.
   */
  createRenderElement: function(item, render) {
    validate(item, "item", { isInstanceOf: Item });
    validate(render, "render", { isRequired: true });

    var element = dom.create("div");
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
  initializeRender: function(render) {
    validate(render, "render", { isRequired: true });
    this.layout.initializeRender(render, this.layoutMethodOptions);
  },

  /**
   * Delegates to the Layout instance to load the render contents.
   *
   * @param {!Object} render - render to load
   * @return {undefined}
   */
  loadRender: function(render) {
    validate(render, "render", { isRequired: true });

    this.layout.loadRender(render, this.layoutMethodOptions);

    if (render.isLoadNeeded) {
      render.isLoadNeeded = false;
    }
  },

  /**
   * Delegates to the layout instance to unload the render contents.
   *
   * @param {!Object} render - render to unload
   * @return {undefined}
   */
  unloadRender: function(render) {
    validate(render, "render", { isRequired: true });
    this.layout.unloadRender(render, this.layoutMethodOptions);
  },

  /**
   * Returns a boolean indicating whether this render should be loaded at this time.
   *
   * The {@link Layout} can implement a method "shouldLoadRender" to specifiy whether
   * any given render should be loaded.
   *
   * If the {@link Layout} returns false
   *
   * @param {!Object} render - render to check whether it needs to be loaded
   * @return {boolean}
   */
  shouldLoadRender: function(render) {
    validate(render, "render", { isRequired: true });

    return this.layout.shouldLoadRender(render) ||
      render.isLoadNeeded ||
      this.frame.isElementVisible(render.element);
  },

  /**
   * Loads or unloads a render depending on factors like whether its visible in the
   * frame element, etc.
   *
   * @param {!Object} render render to load or unload
   * @return {undefined}
   */
  loadOrUnloadRender: function(render) {
    if (this.shouldLoadRender(render)) {
      this.loadRender(render);
    } else {
      this.unloadRender(render);
    }
  },

  /**
   * Loads or unloads all the renders managed by the Viewport.
   *
   * @return {undefined}
   */
  loadOrUnloadRenders: function() {
    _.each(this.getRenders(), function(render) {
      this.loadOrUnloadRender(render);
    }, this);
  },

  /**
   * Gets the custom renders
   *
   * @return {undefined}
   */
  getCustomRenders: function() {
    return this.customRenders;
  },

  /**
   * Gets a custom render by id
   *
   * @param id
   * @return {undefined}
   */
  getCustomRender: function(id) {
    return this.customRenders[id];
  },

  /**
   * Sets a custom render in the internal data structure
   *
   * @param customRender
   * @return {undefined}
   */
  setCustomRender: function(customRender) {
    validate(customRender, "customRender", { isRequired: true });

    this.customRenders[customRender.id] = customRender;

    this.emit(DecksEvent("viewport:custom:render:drawn", this, customRender));
  },

  /**
   * Removes a custom render from the internal data structure.
   *
   * @param customRender
   * @return {undefined}
   */
  removeCustomRender: function(customRender) {
    validate(customRender, "customRender", { isRequired: true });

    delete this.customRenders[customRender.id];

    this.emit(DecksEvent("viewport:custom:render:erased", this, customRender));
  },

  /**
   * Indicates if there are any custom renders.
   *
   * @return {undefined}
   */
  hasCustomRenders: function() {
    return !_.isEmpty(this.customRenders);
  },

  /**
   * Draws a custom render by initiating its animation.
   *
   * @param customRender
   * @return {undefined}
   */
  drawCustomRender: function(customRender) {
    var self = this;

    validate(customRender, "customRender", { isRequired: true });

    self.setDefaultCustomRenderAnimateOptions(customRender);
    self.customRendersDrawingCount++;

    if (self.config.debugDrawing) {
      console.log("Viewport#drawCustomRender: custom renders drawing count: " + self.customRendersDrawingCount);
    }

    var eventName = customRender.isErasing ? "viewport:custom:render:erasing" : "viewport:custom:render:drawing";

    raf(function() {
      self.emit(DecksEvent(eventName, self, customRender));
      raf(function() {
        self.animator.animate({
          elements: customRender.element,
          properties: customRender.transform,
          options: customRender.animateOptions
        });
      });
    });
  },

  /**
   * Calls the {@link Layout} to get custom renders, and initiates the drawing cycle for all of them.
   *
   * @return {undefined}
   */
  drawCustomRenders: function() {
    var layoutCustomRenders = this.layout.getCustomRenders(this.layoutMethodOptions) || [];

    if (!_.isArray(layoutCustomRenders)) {
      layoutCustomRenders = [layoutCustomRenders];
    }

    var customRenders = {};

    _.each(layoutCustomRenders, function(customRender, index) {
      // Since these are not re-used, give each one a unique ID
      customRender.id = "" + _.uniqueId(); //customRender.id || ("" + index);
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
  eraseCustomRender: function(customRender) {
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
  eraseCustomRenders: function() {
    _.each(this.getCustomRenders(), function(customRender) {
      this.eraseCustomRender(customRender);
    }, this);
  },

  /**
   * Sets the default animation options for a custom render animation.
   *
   * @param customRender
   * @return {undefined}
   */
  setDefaultCustomRenderAnimateOptions: function(customRender) {
    var self = this;

    validate(customRender, "customRender", { isRequired: true });

    customRender.animateOptions.complete = function(/*elements*/) {
      self.onCustomRenderAnimationComplete(customRender);
    };
  },

  /**
   * Helper function for creating a custom render element with a default position.
   *
   * @param customRender
   * @return {undefined}
   */
  createCustomRenderElement: function() {
    var element = dom.create("div");
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
  panToItem: function(item, renderIdOrIndex) {
    validate(item, "item", { isInstanceOf: Item });
    var render = this.getRender(item, renderIdOrIndex);
    validate(render, "render", { isRequired: true });
    validate(render.element, "render.element", { isRequired: true });
    this.canvas.panToElement(render.element);
  },

  /**
   * Called when the {@link Deck} is ready.  Triggers a draw/load cycle.
   *
   * @return {undefined}
   */
  onDeckReady: function() {
    this.isDeckReady = true;
    if (this.config.debugDrawing) {
      console.info("Viewport#onDeckReady: drawing items (load needed)");
    }
    this.drawItems({ isLoadNeeded: true }); // Needs loading because the items haven't been loaded before
  },

  /**
   * Called when a draw request is made on the {@link Deck}.  Triggers a redraw/reload cycle.
   *
   * @return {undefined}
   */
  onDeckDraw: function() {
    if (this.config.debugDrawing) {
      console.info("Viewport#onDeckDraw: drawing items (load needed)");
    }
    this.drawItems({ isLoadNeeded: true }); // Needs loading because this is a manual, programmatic draw request
  },

  /**
   * Called before the {@link Deck} {@link Layout} is about to be set.
   *
   * @return {undefined}
   */
  onDeckLayoutSetting: function() {
    if (this.config.debugDrawing) {
      console.info("Viewport#onDeckLayoutSetting: erasing custom renders");
    }
    this.eraseCustomRenders();
  },

  /**
   * Called when a new layout is set on the {@link Deck}.  Triggers a redraw/reload cycle.
   *
   * @return {undefined}
   */
  onDeckLayoutSet: function(e) {
    var layout = e.data;
    this.setLayout(layout);
    if (this.config.debugDrawing) {
      console.info("Viewport#onDeckLayoutSet: drawing items (load needed)");
    }
    this.drawItems({ isLoadNeeded: true }); // Needs loading because different layouts may have different item representations.
  },

  /**
   * Called before the {@link Frame} bounds are about to be set.
   *
   * @return {undefined}
   */
  onFrameBoundsSetting: function() {
    if (this.config.debugDrawing) {
      console.info("Viewport#onFrameBoundsSetting: erasing custom renders");
    }
    this.eraseCustomRenders();
  },

  /**
   * Called when the {@link Frame} bounds are set.  Triggers a redraw cycle.
   *
   * @return {undefined}
   */
  onFrameBoundsSet: function() {
    if (this.config.debugDrawing) {
      console.info("Viewport#onFrameBoundsSet: draw items (load not needed)");
    }
    this.drawItems({ isLoadNeeded: false }); // Doesn't need loading because we should just be moving things around based on new frame bounds
  },

  onItemChanged: function(e) {
    var item = e.sender;
    if (this.config.debugDrawing) {
      console.info("Viewport#onItemChanged: drawing item (load needed)", item);
    }
    this.drawItem(item, { isLoadNeeded: true }); // Needs loading because change to item might require new representation.
  },

  onItemIndexChanged: function(e) {
    var item = e.sender;
    var index = e.data;
    if (this.config.debugDrawing) {
      console.info("Viewport#onItemIndexChanged: drawing item (load needed)", item, index);
    }
    this.drawItem(item, { isLoadNeeded: true }); // TODO: not sure if this needs loading
  },

  onItemCollectionItemAdding: function() {
    // TODO: remove this event if not needed
  },

  onItemCollectionItemAdded: function() {
    // TODO: remove this event if not needed
  },

  onItemCollectionItemRemoving: function() {
    // TODO: remove this event if not needed
  },

  onItemCollectionItemRemoved: function(e) {
    var item = e.data;
    if (this.config.debugDrawing) {
      console.info("Viewport#onItemCollectionItemRemoved: erasing item", item);
    }
    this.eraseItem(item);
  },

  onItemCollectionClearing: function() {
    // TODO: remove this event if not needed
  },

  onItemCollectionCleared: function(e) {
    var items = e.data;
    if (this.config.debugDrawing) {
      console.info("Viewport#onItemCollectionCleared: erasing items", items);
    }
    this.eraseItems(items);
  },

  onItemCollectionIndexing: function(e) {
    var stats = e.data;
    if (stats.totalCount > 0 || (stats.totalCount === 0 && stats.reason.isClear)) {
      if (this.config.debugDrawing) {
        console.info("Viewport#onItemCollectionIndexing: erasing custom renders");
      }
      this.eraseCustomRenders();
    }
  },

  onItemCollectionIndexed: function(e) {
    var stats = e.data;
    if (stats.totalCount > 0 && stats.changedCount === 0) {
      // If there are items in the collection, but no indexes changed, there will be no drawing
      // operations, so simulate the end of a drawing cycle (so the custom renders can be re-drawn (because
      // they were erased in onItemCollectionIndexing))
      if (this.config.debugDrawing) {
        console.info("Viewport#onItemCollectionIndexed: drawing custom renders");
      }
      this.onAllRenderAnimationsComplete();
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
  onRenderAnimationComplete: function(render) {
    if (render.isErasing) {
      this.removeRender(render);
      if (render.item.isErasing && !this.hasRenders(render.item)) {
        this.removeItem(render.item);
      }
    } else {
      this.setRender(render);
    }

    this.rendersDrawingCount--;
    if (this.rendersDrawingCount === 0) {
      this.onAllRenderAnimationsComplete();
    }
  },

  /**
   * Called when all the animations in a render cycle have been completed.
   *
   * @return {undefined}
   */
  onAllRenderAnimationsComplete: function() {
    var self = this;

    _.defer(function() {
      self.emit(DecksEvent("viewport:all:renders:drawn", self));

      _.defer(function() {
        self.loadOrUnloadRenders();

        _.defer(function() {
          if (self.config.debugDrawing) {
            console.info("Viewport#onAllRenderAnimationsComplete: drawing custom renders");
          }
          self.drawCustomRenders();
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
  onCustomRenderAnimationComplete: function(customRender) {
    if (customRender.isErasing) {
      this.removeCustomRender(customRender);
    } else {
      this.setCustomRender(customRender);
    }

    this.customRendersDrawingCount--;

    if (this.customRendersDrawingCount === 0) {
      this.onAllCustomRenderAnimationsComplete();
    }
  },

  /**
   * Called when all the custom render animations have been completed.
   *
   * @return {undefined}
   */
  onAllCustomRenderAnimationsComplete: function() {
    var self = this;
    _.defer(function() {
      self.emit(DecksEvent("viewport:all:custom:renders:drawn", self));
    });
  },

  /**
   * Called when an element is moved via a gesture.
   *
   * @param e
   * @return {undefined}
   */
  onGestureElementMoved: function(e) {
    var element = e.data;
    if (element === this.canvas.element) {
      this.onCanvasElementMoved(e);
    }
  },

  /**
   * Called when the {@link Canvas} element is moved via a touch gesture.
   *
   * @return {undefined}
   */
  onCanvasElementMoved: function() {
    this.debouncedLoadOrUnloadRenders();
  }
});

module.exports = Viewport;
