var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");
var eventBinder = require("./util").eventBinder;
var Item = require("./item");
var ItemCollection = require("./itemcollection");

function Viewport(options) {
  if (!(this instanceof Viewport)) { return new Viewport(options); }
  EventEmitter.call(this);
  eventBinder.addTo(this);

  this._renders = [];

  this.setFrame(options.frame);
  this.setCanvas(options.canvas);
  this.setAnimator(options.animator);
  this.setItemCollection(options.itemCollection);
  this.setLayout(options.layout);
}

inherits(Viewport, EventEmitter);

_.extend(Viewport.prototype, {

  setFrame: function(frame, options) {
    if (!frame) {
      throw new Error("frame is required.");
    }
    options = options || {};

    if (!(frame instanceof Frame)) {
      frame = new Frame(frame);
    }

    this.frame = frame;

    if (this.canvas) {
      this.frame.setCanvas(this.canvas);
    }

    if (!options.silent) {
      this.emit("frame:set", this.frame);
    }
  },

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
      this.emit("canvas:set", this.canvas);
    }
  },

  setAnimator: function(animator, options) {
    if (!animator) {
      throw new Error("animator is required");
    }
    options = options || {};

    this.animator = animator;

    if (!options.silent) {
      this.emit("animator:set", this.animator);
    }
  },

  setItemCollection: function(itemCollection, options) {
    if (!itemCollection) {
      throw new Error("itemCollection is required");
    }
    options = options || {};

    if (this.itemCollection) {
      this.removeItems();
      this.unbindEvents(this.itemCollection, this._itemCollectionEvents);
      if (options.silent) {
        this.emit("item:collection:unset", this.itemCollection);
      }
    }

    this.itemCollection = itemCollection;
    this.bindEvents(itemCollection, this._itemCollectionEvents);
    this.addItems();
    if (!options.silent) {
      this.emit("item:collection:set", this.itemCollection);
    }
  },

  setLayout: function(layout, options) {
    if (!layout) {
      throw new Error("layout is required");
    }
    options = options || {};

    this.layout = layout;

    // TODO: re-draw

    if (!options.silent) {
      this.emit("layout:set", this.layout);
    }
  },

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

  addItem: function(item, index, options) {
    index = this.indexOfItem(item, index);
    options = options || {};

    var renders = this.layout.getRenders(item);
    this.setRenders(item, index, renders);

    if (!options.silent) {
      this.emit("item:added", { item: item, index: index });
    }
  },

  addItems: function(itemCollection, options) {
    itemCollection = itemCollection || this.itemCollection;
    if (!itemCollection) {
      return;
    }
    options = options || {};

    _.each(itemCollection.getItems(), function(item, index) {
      this.addItem(item, index);
    }, this);

    if (!options.silent) {
      this.emit("items:added");
    }
  },

  removeItem: function(item, index, options) {
    index = this.indexOfItem(item, index);
    options = options || {};

    this.removeRenders(item, index);
    this._renders.splice(index, 1);

    if (!options.silent) {
      this.emit("item:removed", { item: item, index: index });
    }
  },

  removeItems: function(itemCollection, options) {
    itemCollection = itemCollection || this.itemcollection;
    if (!itemCollection) {
      return;
    }
    options = options || {};

    _.each(itemCollection.getItems(), function(item, index) {
      this.removeItem(item, index);
    }, this);

    if (!options.silent) {
      this.emit("items:removed");
    }
  },

  hasRenders: function(item, index) {
    if (!item && !_.isNumber(index)) {
      return this._renders.length > 0;
    }
    var renders = this.getRenders(item, index);
    return _.isArray(renders) && renders.length > 0;
  },

  getRenders: function(item, index) {
    index = this.indexOfItem(item, index);
    return this._renders[index];
  },

  setRenders: function(item, index, renders) {
    index = this.indexOfItem(item, index);

    var previousRenders = this.getRenders(item, index);

    if (_.isArray(previousRenders) && previousRenders.length) {
      // copy any elements from the previous renders onto the new renders
      _.each(renders, function(render, i) {
        if (previousRenders[i] && previousRenders[i].element) {
          render.element = previousRenders[i].element;
        } else {
          render.element = this.createRenderElement();
        }
      }, this);

      // slice off any extra renders that may have been there before
      if (previousRenders.length > renders.length) {
        this._renders = this._renders[index].slice(0, renders.length);
      }
    } else {
      // no previous renders - create a new array
      this._renders[index] = [];
    }

    // save each render, and apply the animation for each
    _.each(renders, function(render, renderIndex) {
      this.animateRender({ item: item, index: index, render: render, renderIndex: renderIndex });
    }, this);
  },

  removeRender: function(item, index, render, options) {
    options = options || {};
    var renders = this.getRenders(item, index);
    var renderIndex = this.indexOfRender(item, index, render);

    this.canvas.removeChildElement(render.element);
    renders.splice(renderIndex, 1);

    if (!options.silent) {
      this.emit("render:removed", { item: item, index: index, render: render, renderIndex: renderIndex });
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
    if (!render.element) { throw new Error("render.element is required"); }
    if (!render.transform) { throw new Error("render.transform is required"); }


    if (_.isArray(transform)) {
      // TODO: not sure how to handle sequences of animations for complete/progress event
      throw new Error("animation sequences is not yet implemented");
    } else {
      var animateOptions = this.getAnimateOptions(options);
      this.animator.animate(render.element, render.transform, render.animateOptions);
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
    "item:added": "_onItemAdded",
    "item:removed": "_onItemRemoved",
    "item:changed": "_onItemChanged",
    "cleared": "_onItemsCleared"
  },

  _onItemAdded: function(data) {
    this.addItem(data.item, data.index);
  },

  _onItemRemoved: function(data) {
    this.removeItem(data.item, data.index);
  },

  _onItemChanged: function(data) {
    this.updateItem(data.item, data.index);
  },

  _onItemsCleared: function(data) {
    this.removeItems();
  },

  _onAnimationComplete: function(options) {
    this._renders[options.index][options.renderIndex] = options.render;
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

