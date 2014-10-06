var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");
var eventBinder = require("./util").eventBinder;
var Canvas = require("./canvas");
var Frame = require("./frame");
var Item = require("./item");
var ItemCollection = require("./itemcollection");

/**
 * Viewport - manages visual (DOM) components
 *
 * @constructor
 * @param {!Object} options options for viewport initialization
 */
function Viewport(options) {
  if (!(this instanceof Viewport)) { return new Viewport(options); }
  EventEmitter.call(this);
  eventBinder.addTo(this);

  this._renders = [];

  this.setFrame(options.frame);
  this.setCanvas(options.canvas);
  this.setAnimator(options.animator);

  if (options.itemCollection) {
    this.setItemCollection(options.itemCollection);
  }

  if (options.layout) {
    this.setLayout(options.layout);
  }
}

inherits(Viewport, EventEmitter);

_.extend(Viewport.prototype, {
  /**
   * Sets the viewport frame
   *
   * @memberof Viewport
   * @instance
   * @param {Frame} frame frame to set
   * @param {object} options additional options
   * @return {undefined}
   */
  setFrame: function(frame, options) {
    if (!frame) { throw new Error("frame is required"); }
    options = options || {};

    if (!(frame instanceof Frame)) {
      frame = new Frame(frame);
    }

    this.frame = frame;

    if (this.canvas) {
      this.frame.setCanvas(this.canvas);
    }

    if (!options.silent) {
      this.emit("viewport:frame:set", this.frame);
    }
  },

  /**
   * Sets the viewport canvas
   *
   * @memberof Viewport
   * @instance
   * @param {Canvas} canvas canvas to set
   * @param {?Object} options additional options
   * @return {undefined}
   */
  setCanvas: function(canvas, options) {
    canvas = canvas || {};
    options = options || {};

    if (!(canvas instanceof Canvas)) {
      canvas = new Canvas(canvas);
    }

    this.canvas = canvas;

    if (this.frame) {
      this.frame.setCanvas(this.canvas);
    }

    if (!options.silent) {
      this.emit("viewport:canvas:set", this.canvas);
    }
  },

  setAnimator: function(animator, options) {
    if (!animator) { throw new Error("animator is required"); }
    options = options || {};

    this.animator = animator;

    if (!options.silent) {
      this.emit("viewport:animator:set", this.animator);
    }
  },

  setItemCollection: function(itemCollection, options) {
    if (!itemCollection) { throw new Error("itemCollection is required"); }
    options = options || {};

    if (this.itemCollection) {
      this.eraseItems();
      this.unbindEvents(this.itemCollection, this._itemCollectionEvents);
      if (!options.silent) {
        this.emit("viewport:item:collection:unset", this.itemCollection);
      }
    }

    this.itemCollection = itemCollection;
    this.bindEvents(itemCollection, this._itemCollectionEvents);
    this.drawItems();
    if (!options.silent) {
      this.emit("viewport:item:collection:set", this.itemCollection);
    }
  },

  setLayout: function(layout, options) {
    if (!layout) { throw new Error("layout is required"); }
    options = options || {};

    this.layout = layout;

    if (this.itemCollection) {
      this.drawItems();
    }

    if (!options.silent) {
      this.emit("viewport:layout:set", this.layout);
    }
  },

  /**
   * Gets the index of an item in the collection
   *
   * @param {Item} item item for which to get index
   * @param {Number} index optional index of item (if specified, this will be returned)
   * @return {Number} index of item in collection
   */
  indexOfItem: function(item, index) {
    if (_.isNumber(index)) {
      return index;
    }
    return this.itemCollection.indexOf(item);
  },

  indexOfRender: function(item, index, render) {
    index = this.indexOfItem(item, index);
    return _.indexOf(this._renders[index], render);
  },

  drawItem: function(item, index, options) {
    if (!item) { throw new Error("item is required"); }
    index = this.indexOfItem(item, index);
    options = options || {};

    var renders = this.layout.getRenders({ item: item, index: index });
    this.drawRenders(item, index, renders);

    if (!options.silent) {
      this.emit("viewport:item:drawn", { item: item, index: index });
    }
  },

  drawItems: function(options) {
    options = options || {};

    _.each(this.itemCollection.getItems(), function(item, index) {
      this.drawItem(item, index);
    }, this);

    if (!options.silent) {
      this.emit("viewport:items:drawn");
    }
  },

  eraseItem: function(item, index, options) {
    if (!item) { throw new Error("item is required"); }
    index = this.indexOfItem(item, index);
    options = options || {};

    this.removeRenders(item, index);
    this._renders.splice(index, 1);

    if (!options.noRedraw) {
      this.drawItems();
    }

    if (!options.silent) {
      this.emit("viewport:item:erased", { item: item, index: index });
    }
  },

  eraseItems: function(options) {
    options = options || {};

    _.each(this.itemCollection.getItems(), function(item, index) {
      this.eraseItem(item, index, { noRedraw: true });
    }, this);

    if (!options.silent) {
      this.emit("viewport:items:erased");
    }
  },

  getRenders: function(item, index) {
    if (!item) { throw new Error("item is required"); }
    index = this.indexOfItem(item, index);
    return this._renders[index];
  },

  drawRenders: function(item, index, renders) {
    if (!item) { throw new Error("item is required"); }
    if (!renders) { throw new Error("renders is required"); }
    index = this.indexOfItem(item, index);

    if (!this._renders[index]) {
      this._renders[index] = [];
    }

    var previousRenders = this.getRenders(item, index);
    var maxLength = Math.max(previousRenders.length, renders.length);
    var sliceIndex = -1;

    _.each(_.range(maxLength), function(renderIndex) {
      var previousRender = previousRenders[renderIndex];
      var render = renders[renderIndex];

      if (previousRender && render) {
        // If we have a previous render for this render, we need to copy the new render data
        // to the previous render.  If the new render has the same transform, we don't need to
        // do anything here.
        var tempRender = _.extend({}, previousRender, render);
        if (_.isEqual(previousRender.transform, tempRender.transform)) {
          return;
        }
        render = tempRender;
      } else if (previousRender) {
        // If we have a previous render that is no longer needed, we need to remove it
        // from the DOM and remove it from our renders array for this item.
        this.canvas.removeRender(previousRender);

        // Don't slice the unneeded renders here - we don't want to mess up the indexes.
        // The slice is done below.
        if (sliceIndex !== -1) {
          sliceIndex = renderIndex;
        }
      } else if (render) {
        // We do not have a previous render for this, create a new element now.
        render.element = this.createRenderElement();
      }

      this.animateRender({ item: item, index: index, render: render, renderIndex: renderIndex });
    }, this);

    // Remove any unneeded renders now
    if (sliceIndex !== -1) {
      this._renders = this._renders.slice(sliceIndex);
    }
  },

  setRender: function(item, index, render, renderIndex, options) {
    options = options || {};
    index = this.indexOfItem(item, index);
    this._renders[index][renderIndex] = render;

    if (!options.silent) {
      this.emit("viewport:render:set", { item: item, index: index, render: render, renderIndex: renderIndex });
    }
  },

  removeRender: function(item, index, render, options) {
    options = options || {};
    var renders = this.getRenders(item, index);
    var renderIndex = this.indexOfRender(item, index, render);

    this.canvas.removeRender(render);
    renders.splice(renderIndex, 1);

    if (!options.silent) {
      this.emit("viewport:render:removed", { item: item, index: index, render: render, renderIndex: renderIndex });
    }
  },

  removeRenders: function(item, index) {
    var renders = this.getRenders(item, index);

    if (!_.isArray(renders) || !renders.length) {
      return;
    }

    _.each(renders, function(render) {
      this.removeRender(item, index, render);
    }, this);
  },

  createRenderElement: function(options) {
    var element = document.createElement("div");
    element.className = "decks-item";
    element.style.position = "absolute";
    return element;
  },

  animateRender: function(options) {
    if (!options) { throw new Error("options is required"); }
    var render = options.render;
    if (!render) { throw new Error("render is required"); }
    if (!render.element) { throw new Error("render.element is required"); }
    if (!render.transform) { throw new Error("render.transform is required"); }
    if (!render.animateOptions) { throw new Error("render.transform is required"); }

    // Make sure the render element is in the DOM
    this.canvas.addRender(render);

    if (_.isArray(render.transform)) {
      // TODO: not sure how to handle sequences of animations for complete/progress event
      throw new Error("animation sequences is not yet implemented");
    } else {
      // Extend the render animation options onto standard options, like callbacks
      var animateOptions = this.getAnimateOptions(options);

      // Start the animation
      this.animator.animate(render.element, render.transform, animateOptions);
    }
  },

  getAnimateOptions: function(options) {
    var defaultOptions = {
      complete: _.bind(this._onAnimationComplete, this, options),
      progress: _.bind(this._onAnimationProgress, this, options)
    };
    return _.extend(defaultOptions, options.render.animateOptions);
  },

  _itemCollectionEvents: {
    "item:collection:item:added": "_onItemAdded",
    "item:collection:item:removed": "_onItemRemoved",
    "item:collection:item:changed": "_onItemChanged",
    "item:collection:cleared": "_onItemsCleared"
  },

  _onItemAdded: function(data) {
    this.drawItem(data.item, data.index);
  },

  _onItemRemoved: function(data) {
    this.eraseItem(data.item, data.index);
  },

  _onItemChanged: function(data) {
    this.drawItem(data.item, data.index);
  },

  _onItemsCleared: function(data) {
    this.eraseItems();
  },

  _onAnimationComplete: function(options) {
    this.setRender(options.item, options.index, options.render, options.renderIndex);
  },

  _onAnimationProgress: function(options) {
    if (this.frame.isElementVisible(options.render.element)) {
      this.layout.loadRender(options);
    } else {
      this.layout.unloadRender(options);
    }
  }
});

module.exports = Viewport;
