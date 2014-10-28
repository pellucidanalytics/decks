var _ = require("lodash");
var binder = require("./events").binder;
var hasEmitter = require("./events").hasEmitter;
var DecksEvent = require("./events").DecksEvent;
var dom = require("./ui").dom;

/**
 * Viewport - manages visual (DOM) components
 *
 * @constructor
 * @mixes binder
 * @mixes hasEmitter
 * @param {!Object} options options for viewport initialization
 * @param {!(Frame|Object)} options.frame Frame instance or options object
 * @param {!(Canvas|Object)} options.canvas Canvas instance or options object
 * @param {?ItemCollection} options.itemCollection ItemCollection instance to use with this Viewport
 * @param {?Layout} options.layout Layout instance to use with this Viewport
 */
function Viewport(options) {
  if (!(this instanceof Viewport)) { return new Viewport(options); }
  options = _.merge({}, this.defaultOptions, options);

  // Create throttled versions of certain methods that are called frequently
  this.throttledLoadOrUnloadRenders = _.throttle(_.bind(this.loadOrUnloadRenders, this), options.throttleLoadOrUnloadRendersWait);
  this.throttledLoadOrUnloadRender = _.throttle(_.bind(this.loadOrUnloadRender, this), options.throttleLoadOrUnloadRenderWait);
  this.debouncedDrawItems = _.debounce(_.bind(this.drawItems, this), options.debounceDrawItemsWait);

  this.renders = {};
  this.rendersDrawing = 0;
  this.isDeckReady = false;

  this.setAnimator(options.animator);
  this.setConfig(options.config);
  this.setEmitter(options.emitter, this.emitterEvents);
  this.setItemCollection(options.itemCollection);
  this.setLayout(options.layout);
  this.setFrame(options.frame);
  this.setCanvas(options.canvas);
}

_.extend(Viewport.prototype, binder, hasEmitter, /** @lends Viewport.prototype */ {
  /**
   * Default options for instances of Viewport
   */
  defaultOptions: {
    throttleLoadOrUnloadRenderWait: 1000,
    throttleLoadOrUnloadRendersWait: 1000,
    debounceDrawItemsWait: 1000
  },

  /**
   * Event to method mapping for binding to the decks emitter.
   */
  emitterEvents: {
    "deck:ready": "onDeckReady",
    "deck:layout:set": "onDeckLayoutSet",
    "frame:bounds:set": "onFrameBoundsSet",
    "item:changed": "onItemChanged",
    "item:index:changed": "onItemIndexChanged",
    "item:collection:item:removed": "onItemCollectionItemRemoved",
    "gesture:element:moved": "onGestureElementMoved"
  },

  setAnimator: function(animator) {
    if (!animator) { throw new Error("animator is required"); }
    this.animator = animator;
  },

  setConfig: function(config) {
    if (!config) { throw new Error("config is required"); }
    this.config = config;
  },

  setItemCollection: function(itemCollection) {
    if (!itemCollection) { throw new Error("itemCollection is required"); }
    this.itemCollection = itemCollection;
    // itemCollection events are forwarded by the main deck emitter, so we don't need to subscribe to this directly
  },

  setLayout: function(layout) {
    if (!layout) { throw new Error("layout is required"); }
    this.layout = layout;
  },

  setFrame: function(frame) {
    if (!frame) { throw new Error("frame is required"); }
    this.frame = frame;
  },

  setCanvas: function(canvas) {
    if (!canvas) { throw new Error("canvas is required"); }
    this.canvas = canvas;
  },

  /**
   * Starts the drawing (animation) process for an Item.
   *
   * 1. Request one or more "render" objects from the Layout.  A "render" is basically
   * an object that specifies where to place an item in the canvas, along with animation
   * information to animate the positioning/transform/delay/druation/etc.  A Layout can provide
   * more than one render for an single Item, if the item needs to be displayed multiple times within
   * the canvas (e.g. if one item belongs in multiple visual collections on the screen).
   *
   * 2. Initiate the draw process for each render.
   *
   * @param {!Item} item item to draw
   * @return {undefined}
   */
  drawItem: function(item, options) {
    if (!item) { throw new Error("item is required"); }

    if (!this.isDeckReady) {
      if (this.config.debugDrawing) {
        console.warn("viewport: not drawing - deck is not ready");
      }
      return;
    }

    // Give the layout some contextual info/objects to help with creating renders
    var layoutRenders = this.layout.getRenders(item, this.getLayoutMethodOptions()) || [];

    if (!_.isArray(layoutRenders)) {
      layoutRenders = [layoutRenders];
    }

    var renders = {};

    _.each(layoutRenders, function(render, index) {
      // Assign ids to each render (based on the array index), and change it from an array to
      // an object with the render id as the key, and the render as the value.  Also, add some additional
      // data to the render, like the item.
      _.merge(render, options, {
        id: "" + index,
        index: index,
        item: item
      });

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
    if (!item) { throw new Error("item is required"); }

    // Item will be removed once all the renders are fully removed
    item.isRemoving = true;

    this.eraseRenders(item);
  },

  /**
   * Starts the erasing process for all the Items in the ItemCollection.
   *
   * @return {undefined}
   */
  eraseItems: function() {
    var items = this.itemCollection.getItems();

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
    if (!item) { throw new Error("item is required"); }

    delete this.renders[item.id];

    this.emit(DecksEvent("viewport:item:removed", this, item));
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
      return _(this.renders)
        .map(_.values)
        .map(_.values)
        .flatten()
        .value();
    }

    if (!this.renders[item.id]) {
      this.renders[item.id] = {};
    }

    return this.renders[item.id];
  },

  /**
   * Checks if an Item currently has any renders stored in the Viewport items/renders
   * data structure.
   *
   * @param {!Item} item Item for which to check for the existence of renders
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
    if (!render) { throw new Error("render is required"); }

    var renders = this.getRenders(render.item);

    renders[render.id] = render;

    this.emit(DecksEvent("viewport:render:set", this, render));
  },

  /**
   * Starts the drawing process for a render.
   *
   * A render is an object which contains a DOM element - the render "container" element,
   * a "transform" - a hash of CSS properties and values to animate/set, and an "animateOptions"
   * which is a hash of animation properties, like duration, easing, etc.  A render is drawn
   * by executing the transform on the element, using a compatible animation function like
   * VelocityJS.  The drawing/animation process is asynchronous - this method starts the process,
   * and callbacks are used to track progress and completion of the animation.
   *
   * @param {!Object} options animation options
   * @param {!Object} options.render render object
   * @param {!HTMLElement} options.render.element render element
   * @param {!Object} options.render.transform hash of CSS style properties to animate
   * @param {!Object} options.render.animateOptions animation options
   * @return {undefined}
   */
  drawRender: function(render) {
    if (!render) { throw new Error("render is required"); }
    if (!render.element) { throw new Error("render.element is required"); }
    if (!render.transform) { throw new Error("render.transform is required"); }
    if (!render.animateOptions) { throw new Error("render.animateOptions is required"); }

    var animateOptions = this.getRenderAnimateOptions(render);

    this.animator.animate({
      elements: render.element,
      properties: render.transform,
      options: animateOptions
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
  drawRenders: function(item, renders) {
    if (!item) { throw new Error("item is required"); }
    if (!renders) { throw new Error("renders is required"); }

    var previousRenders = this.getRenders(item);

    var previousRenderIds = _.keys(previousRenders);
    var newRenderIds = _.keys(renders);

    var renderIdsToMerge = _.intersection(previousRenderIds, newRenderIds);
    var renderIdsToRemove = _.difference(previousRenderIds, renderIdsToMerge);
    var renderIdsToAdd = _.difference(newRenderIds, renderIdsToMerge);

    this.rendersDrawing += (renderIdsToMerge.length + renderIdsToRemove.length + renderIdsToAdd.length);

    if (this.config.debugDrawing) {
      console.log("viewport: drawing renders for item", JSON.stringify({
        item: item.id,
        previousRenderIds: previousRenderIds,
        newRenderIds: newRenderIds,
        renderIdsToMerge: renderIdsToMerge,
        renderIdsToRemove: renderIdsToRemove,
        renderIdsToAdd: renderIdsToAdd
      }));
    }

    // Previous and new render exist - copy the new data onto the previous, and
    // check if we need to re-draw (if transform has changed)
    _.each(renderIdsToMerge, function(renderId) {
      var previousRender = previousRenders[renderId];
      var newRender = renders[renderId];

      // Merge the old and new renders together, with new values winning over old values
      // This is done to preserve the render element, and other state values that are not
      // provided by the Layout's new render.
      var mergedRender = _.merge({}, previousRender, newRender);

      // If the new render has the same transform as the current render, and doesn't need to be
      // reloaded, we don't need to do anything
      if (_.isEqual(previousRender.transform, mergedRender.transform) && !mergedRender.loadNeeded) {
        if (this.config.debugDrawing) {
          console.warn("viewport: not redrawing item render (no change to transform)", item, mergedRender);
        }
        return;
      }

      // Start the animation of the merged render
      this.drawRender(mergedRender);
    }, this);

    // New render with no corresponding previous render - create the container element, and animate it
    _.each(renderIdsToAdd, function(renderId) {
      var newRender = renders[renderId];

      // Create a new render container element
      newRender.element = this.createRenderElement(item, newRender);

      // Unload the render (so it has a default UI state)
      this.unloadRender(newRender);

      // Start the animation of the new render
      this.drawRender(newRender);
    }, this);

    // Previous render exists with no corresponding new render - remove the previous render
    _.each(renderIdsToRemove, function(renderId) {
      var previousRender = previousRenders[renderId];

      // This render is no longer needed, start the erase process for it
      // This can happen if a Layout provides multiple renders for an Item, but another Layout only provides one render
      // for the Item.  We just throw away the extras.
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
    if (!render) { throw new Error("render is required"); }

    render.isRemoving = true;

    this.layout.setHideAnimation(render);

    // Once the "hide" operation is completed, the render will be removed
    this.drawRender(render);
  },

  /**
   * Removes all the renders for an item
   *
   * @param {!Item} item item from which to remove all renders
   * @param {?Number} index index of item, if known
   * @param {?Object} options additional options
   * @return {undefined}
   */
  eraseRenders: function(item) {
    if (!item) { throw new Error("item is required"); }

    var renders = this.getRenders(item);

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
  removeRender: function(render) {
    if (!render) { throw new Error("render is required"); }

    var renders = this.getRenders(render.item);

    delete renders[render.id];

    this.emit(DecksEvent("viewport:render:removed", this, render));
  },

  /**
   * Gets the default animation options, extended with the options.render.animateOptions
   *
   * @param {!Object} options object to pass to callback methods, like complete and progress
   * @return {Object} hash of animation options
   */
  getRenderAnimateOptions: function(render) {
    if (!render) { throw new Error("render is required"); }

    // Create a default animate options object with bound callbacks
    // for the animation events (begin, progress, complete).  The merge the animationOptions
    // from the render on top of that.
    var defaultAnimateOptions = {
      begin: _.bind(function(elements) {
        render.animationBeginData = {
          elements: elements
        };
        this.onAnimationBegin(render);
      }, this),

      complete: _.bind(function(elements) {
        render.animationCompleteData = {
          elements: elements
        };
        this.onAnimationComplete(render);
      }, this),

      progress: _.bind(function(elements, percentComplete, timeRemaining, timeStart) {
        render.animationProgressData = {
          elements: elements,
          percentComplete: percentComplete,
          timeRemaining: timeRemaining,
          timeStart: timeStart
        };
        this.onAnimationProgress(render);
      }, this)
    };

    return _.extend(defaultAnimateOptions, render.animateOptions);
  },

  /**
   * Creates a container element for an individual render
   *
   * @return {HTMLElement} detached DOM element which will become the container for a render element.
   */
  createRenderElement: function(item, render) {
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
   * Delegates to the Layout instance to load the render contents.
   *
   * @param {!Object} render - render to load
   * @return {undefined}
   */
  loadRender: function(render) {
    if (!render) { throw new Error("render is required"); }

    this.layout.loadRender(render, this.getLayoutMethodOptions());

    if (render.loadNeeded) {
      render.loadNeeded = false;
    }
  },

  /**
   * Delegates to the layout instance to unload the render contents.
   *
   * @param {!Object} render - render to unload
   * @return {undefined}
   */
  unloadRender: function(render) {
    if (!render) { throw new Error("render is required"); }

    this.layout.unloadRender(render, this.getLayoutMethodOptions());
  },

  /**
   * Loads or unloads a render depending on factors like whether its visible in the
   * frame element, etc.
   *
   * @param {!Object} render render to load or unload
   * @return {undefined}
   */
  loadOrUnloadRender: function(render) {
    if (!render) { throw new Error("render is required"); }

    if (this.frame.isElementVisible(render.element) || render.loadNeeded) {
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
   * Gets options to pass to Layout methods.
   *
   * @return {undefined}
   */
  getLayoutMethodOptions: function() {
    return {
      animator: this.animator,
      config: this.config,
      emitter: this.emitter,
      itemCollection: this.itemCollection,
      layout: this.layout,
      frame: this.frame,
      canvas: this.canvas,
      viewport: this
    };
  },

  /**
   * Called when the deck is ready.  Starts the drawing cycle for the items.
   *
   * @return {undefined}
   */
  onDeckReady: function() {
    if (this.config.debugDrawing) {
      console.info("draw items (deck ready)");
    }

    this.isDeckReady = true;

    this.drawItems({ loadNeeded: true });
  },

  onDeckLayoutSet: function(e) {
    var layout = e.data;

    if (this.config.debugDrawing) {
      console.info("draw items (deck layout set)");
    }

    this.setLayout(layout);

    this.drawItems({ loadNeeded: true });
  },

  onFrameBoundsSet: function() {
    if (this.config.debugDrawing) {
      console.info("draw items (frame bounds set)");
    }

    this.debouncedDrawItems();
  },

  onItemChanged: function(e) {
    var item = e.sender;

    if (this.config.debugDrawing) {
      console.info("draw item (item changed)", item);
    }

    this.drawItem(item, { loadNeeded: true });
  },

  onItemIndexChanged: function(e) {
    var item = e.sender;
    var index = e.data;

    if (this.config.debugDrawing) {
      console.info("draw item (item index changed)", item, index);
    }

    this.drawItem(item, { loadNeeded: true });
  },

  onItemCollectionItemRemoved: function(e) {
    var item = e.data;

    if (this.config.debugDrawing) {
      console.info("erase item (item removed)", item);
    }

    this.eraseItem(item);
  },

  onAnimationBegin: function(render) {
    // This tells the Canvas to add the element to it's container element
    this.emit(DecksEvent("viewport:animation:begin", this, render));
  },

  onAnimationComplete: function(render) {
    if (render.isRemoving) {
      // If the render was marked for removal, remove it from the Viewport data structure now
      this.removeRender(render);

      // If the item was marked for removal, and the final render for the item has been removed,
      // remove the item now
      if (render.item.isRemoving && !this.hasRenders(render.item)) {
        this.removeItem(render.item);
      }
    } else {
      // Store the render in the Viewport data structure
      this.setRender(render);

      this.loadOrUnloadRender(render);
    }

    this.rendersDrawing--;
    if (this.rendersDrawing === 0) {
      this.emit(DecksEvent("viewport:all:renders:drawn", this));
    }

    this.emit(DecksEvent("viewport:animation:complete", this, render));
  },

  onAnimationProgress: function(render) {
    // As the render is animated, we might want to load or unload the render's content
    // based on where the render element is located.
    this.throttledLoadOrUnloadRender(render);
  },

  onGestureElementMoved: function(e) {
    var element = e.data;
    if (element === this.canvas.element) {
      this.onCanvasElementMoved(e);
    }
  },

  onCanvasElementMoved: function() {
    this.throttledLoadOrUnloadRenders();
  }
});

module.exports = Viewport;
