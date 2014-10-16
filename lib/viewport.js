var _ = require("lodash");
var services = require("./services");
var binder = require("./events").binder;
var DecksEvent = require("./events").DecksEvent;
var dom = require("./ui").dom;

/**
 * Viewport - manages visual (DOM) components
 *
 * @constructor
 * @mixes binder
 * @param {!Object} options options for viewport initialization
 * @param {!(Frame|Object)} options.frame Frame instance or options object
 * @param {!(Canvas|Object)} options.canvas Canvas instance or options object
 * @param {?ItemCollection} options.itemCollection ItemCollection instance to use with this Viewport
 * @param {?Layout} options.layout Layout instance to use with this Viewport
 */
function Viewport() {
  if (!(this instanceof Viewport)) { return new Viewport(); }

  this._renders = {};

  this.bindEvents(services.emitter, Viewport.emitterEvents);
}

Viewport.emitterEvents = {
  "deck:ready": "onDeckReady",
  "deck:layout:set": "onDeckLayoutSet",
  "frame:bounds:set": "onFrameBoundsSet",
  "item:changed": "onItemChanged",
  "item:index:changed": "onItemIndexChanged",
  //"item:collection:item:added": "onItemCollectionItemAdded", // Don't use this - the item:index:changed handles added items
  "item:collection:item:removed": "onItemCollectionItemRemoved",
  //"item:collection:cleared": "onItemCollectionCleared", // Don't use this - item:collection:item:removed is called for each item
};

_.extend(Viewport.prototype, binder, /** @lends Viewport.prototype */ {
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
  drawItem: function(item) {
    if (!item) { throw new Error("item is required"); }

    // TODO: what should be passed here?  Clone of services?  Subset?
    // Just pass the full services object now, even though most of it is probably not needed.
    // The layout might need information like the frame bounds, etc.
    var layoutRenders = services.layout.getRenders(item, services);

    if (!_.isArray(layoutRenders)) {
      layoutRenders = [layoutRenders];
    }

    // Assign ids to each render (based on the array index), and change it from an array to
    // an object with the render id as the key, and the render as the value.  Also, add some additional
    // data to the render, like the item.
    var renders = {};

    _.each(layoutRenders, function(render, index) {
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
  drawItems: function() {
    var items = services.itemCollection.getItems();
    _.each(items, function(item) {
      this.drawItem(item);
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
    item.isRemoving = true;
    this.eraseRenders(item);
  },

  /**
   * Starts the erasing process for all the Items in the ItemCollection.
   *
   * @return {undefined}
   */
  eraseItems: function() {
    var items = services.itemCollection.getItems();
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
    delete this._renders[item.id];
    services.emitter.emit(DecksEvent("viewport:item:removed", this, item));
  },

  /**
   * Gets the renders object for the given Item.
   *
   * This returns the renders currently stored in the Viewport instance,
   * it does not request new renders from the Layout.
   *
   * @param {!Item} item item for which to get renders
   * @return {Object[]} array of renders for the given item
   */
  getRenders: function(item) {
    if (!item) { throw new Error("item is required"); }
    if (!this._renders[item.id]) {
      this._renders[item.id] = {};
    }
    return this._renders[item.id];
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
    services.emitter.emit(DecksEvent("viewport:render:set", this, render));
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
    services.emitter.emit(DecksEvent("viewport:render:removed", this, render));
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

    var animateOptions = this.getAnimateOptions(render);

    services.animator.animate({
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

    //console.log("viewport: drawing renders", item);

    var previousRenders = this.getRenders(item);

    var previousRenderIds = _.keys(previousRenders);
    var newRenderIds = _.keys(renders);
    var renderIdsToMerge = _.intersection(previousRenderIds, newRenderIds);
    var renderIdsToRemove = _.difference(previousRenderIds, renderIdsToMerge);
    var renderIdsToAdd = _.difference(newRenderIds, renderIdsToMerge);

    if (services.config.debugDrawing) {
      console.log("drawing renders for item", JSON.stringify({
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
      var mergedRender = _.extend({}, previousRender, newRender);

      // If the new render has the same transform as the current render, we don't need to do anything
      if (_.isEqual(previousRender.transform, mergedRender.transform)) {
        if (services.config.debugDrawing) {
          console.warn("not redrawing item render (no change to transform)", item, mergedRender);
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
    services.layout.setHideAnimation(render);
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
   * Gets the default animation options, extended with the options.render.animateOptions
   *
   * @param {!Object} options object to pass to callback methods, like complete and progress
   * @return {Object} hash of animation options
   */
  getAnimateOptions: function(render) {
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
    dom.addClass(element, services.constants.itemClassName);
    dom.setStyle(element, "position", "absolute");
    dom.setStyle(element, "top", 0);
    dom.setStyle(element, "left", 0);
    dom.setAttr(element, "data-item-id", item.id);
    dom.setAttr(element, "data-render-id", render.id);
    return element;
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
    if (services.frame.isElementVisible(render.element)) {
      services.layout.loadRender(render, services);
    } else {
      services.layout.unloadRender(render, services);
    }
  },

  onDeckReady: function() {
    if (services.config.debugDrawing) {
      console.info("draw items (deck ready)");
    }
    this.drawItems();
  },

  onDeckLayoutSet: function() {
    if (services.config.debugDrawing) {
      console.info("draw items (deck layout set)");
    }
    this.drawItems();
  },

  onFrameBoundsSet: function() {
    if (services.config.debugDrawing) {
      console.info("draw items (frame bounds set)");
    }
    this.drawItems();
  },

  onItemChanged: function(e) {
    var item = e.sender;
    if (services.config.debugDrawing) {
      console.info("draw item (item changed)", item);
    }
    this.drawItem(item);
  },

  onItemIndexChanged: function(e) {
    var item = e.sender;
    var index = e.data;
    if (services.config.debugDrawing) {
      console.info("draw item (item index changed)", item, index);
    }
    this.drawItem(item);
  },

  /*
  onItemCollectionItemAdded: function(e) {
    var item = e.data;
    if (services.config.debugDrawing) {
      console.info("draw item (item added)", item);
    }
    this.drawItem(item);
  },
  */

  onItemCollectionItemRemoved: function(e) {
    var item = e.data;
    if (services.config.debugDrawing) {
      console.info("erase item (item removed)", item);
    }
    this.eraseItem(item);
  },

  /*
  onItemCollectionCleared: function() {
    if (services.config.debugDrawing) {
      console.info("erase items (item collection cleared)");
    }
    this.eraseItems();
  },
  */

  onAnimationBegin: function(render) {
    // This tells the Canvas to add the element to it's container element
    services.emitter.emit(DecksEvent("viewport:animation:begin", this, render));
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
    }

    services.emitter.emit(DecksEvent("viewport:animation:complete", this, render));
  },

  onAnimationProgress: function(render) {
    // As the render is animated, we might want to load or unload the render's content
    // based on where the render element is located.
    this.loadOrUnloadRender(render);
  }
});

module.exports = Viewport;
