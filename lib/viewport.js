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
  //"item:collection:item:added": "onItemCollectionItemAdded",
  "item:collection:item:removed": "onItemCollectionItemRemoved",
  "item:collection:cleared": "onItemCollectionCleared",
};

_.extend(Viewport.prototype, binder, /** @lends Viewport.prototype */ {

  drawItem: function(item) {
    if (!item) { throw new Error("item is required"); }

    var layoutRenders = services.layout.getRenders(item);

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
   * Draws all the items in the Viewport's ItemCollection.
   *
   * @param {?Object} options additional options
   * @return {undefined}
   */
  drawItems: function() {
    var items = services.itemCollection.getItems();
    _.each(items, function(item) {
      this.drawItem(item);
    }, this);
  },

  /**
   * Erases all the renders for the given Item, and removes the Item itself.
   *
   * @param {Item} item item for which to remove renders
   * @param {?Object} options additional options
   * @return {undefined}
   */
  eraseItem: function(item) {
    if (!item) { throw new Error("item is required"); }
    item.isRemoving = true;
    this.eraseRenders(item);
  },

  /**
   * Erases the renders for all items in the ItemCollection
   *
   * @param {?Object} options additional options
   * @return {undefined}
   */
  eraseItems: function() {
    var items = services.itemCollection.getItems();
    _.each(items, function(item) {
      this.eraseItem(item);
    }, this);
  },

  removeItem: function(item) {
    if (!item) { throw new Error("item is required"); }
    delete this._renders[item.id];
    services.emitter.emit(DecksEvent("viewport:item:removed", this, item));
  },

  /**
   * Gets the renders object for the given item
   *
   * This returns the renders currently stored in the Viewport instance,
   * it does not request new renders from the Layout.
   *
   * @param {Item} item item for which to get renders
   * @return {Object[]} array of renders for the given item
   */
  getRenders: function(item) {
    if (!item) { throw new Error("item is required"); }
    if (!this._renders[item.id]) {
      this._renders[item.id] = {};
    }
    return this._renders[item.id];
  },

  hasRenders: function(item) {
    return !_.isEmpty(this.getRenders(item));
  },

  /**
   * Sets the given render object on an item
   *
   * @param {!Object} render render object to set
   * @param {?Object} options additional options
   * @return {undefined}
   */
  setRender: function(render) {
    if (!render) { throw new Error("render is required"); }
    var renders = this.getRenders(render.item);
    renders[render.id] = render;
    services.emitter.emit(DecksEvent("viewport:render:set", this, render));
  },

  removeRender: function(render) {
    if (!render) { throw new Error("render is required"); }
    var renders = this.getRenders(render.item);
    delete renders[render.id];
    services.emitter.emit(DecksEvent("viewport:render:removed", this, render));
  },

  /**
   * Starts an animation to draw a render element
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
   * Draws the specified renders for the given item
   *
   * @param {Item} item item for which to draw renders
   * @param {Object} renders renders to draw for the item
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

    // Previous and new render exist - copy the new data onto the previous, and
    // check if we need to re-draw (if transform has changed)
    _.each(renderIdsToMerge, function(renderId) {
      var previousRender = previousRenders[renderId];
      var newRender = renders[renderId];
      var mergedRender = _.extend({}, previousRender, newRender);
      if (_.isEqual(previousRender.transform, mergedRender.transform)) {
        return;
      }
      this.drawRender(mergedRender);
    }, this);

    // New render with no corresponding previous render - create the container element, and animate it
    _.each(renderIdsToAdd, function(renderId) {
      var newRender = renders[renderId];
      newRender.element = this.createRenderElement(item, newRender);
      this.drawRender(newRender);
    }, this);

    // Previous render exists with no corresponding new render - remove the previous render
    _.each(renderIdsToRemove, function(renderId) {
      var previousRender = previousRenders[renderId];
      this.eraseRender(previousRender);
    }, this);
  },

  /**
   * Removes a render from an item, and also removes the render's DOM element from
   * the Canvas
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
   * Removes all the renders from an item
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
   * Creates the container element for a render
   *
   * @return {HTMLElement} detached DOM element to contain a render
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

  loadOrUnloadRender: function(render) {
    if (services.frame.isElementVisible(render.element)) {
      services.layout.loadRender(render);
    } else {
      services.layout.unloadRender(render);
    }
  },

  onDeckReady: function() {
    this.drawItems();
  },

  onDeckLayoutSet: function() {
    this.drawItems();
  },

  onFrameBoundsSet: function() {
    this.drawItems();
  },

  onItemChanged: function(e) {
    var item = e.sender;
    this.drawItem(item);
  },

  onItemIndexChanged: function(e) {
    var item = e.sender;
    this.drawItem(item);
  },

  onItemCollectionItemAdded: function(e) {
    var item = e.data;
    this.drawItem(item);
  },

  onItemCollectionItemRemoved: function(e) {
    var item = e.data;
    this.eraseItem(item);
  },

  onItemCollectionCleared: function() {
    this.eraseItems();
  },

  onAnimationBegin: function(render) {
    services.emitter.emit(DecksEvent("viewport:animation:begin", this, render));
  },

  onAnimationComplete: function(render) {
    //console.log("viewport: animation complete", render, render.item);

    if (render.isRemoving) {
      // If the render was marked for removal, remove it now - it's removal animation should be done
      this.removeRender(render);

      // If the item was marked for removal, and the final render for the item has been removed,
      // remove the item now
      if (render.item.isRemoving && !this.hasRenders(render.item)) {
        this.removeItem(render.item);
      }
    } else {
      this.setRender(render);
    }

    services.emitter.emit(DecksEvent("viewport:animation:complete", this, render));
  },

  onAnimationProgress: function(render) {
    this.loadOrUnloadRender(render);
  }
});

module.exports = Viewport;
