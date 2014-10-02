# Design Notes

## Item

An Item represents some arbitrary data model, and emits events when the
model data is changed.

- is an EventEmitter
- has a data object
- emits event when data changes

- get(key) - get data property by key
- set(key, value, options) - set data property by key (emit)
- getData() - get full data object
- setData(data, options) - set full data object (emit)

## ItemCollection

An ItemCollection represents a collection of Items, and emits events
when the collection is changed, or any model is changed.

- is an EventEmitter
- has many Items
- emits even when item added
- emits even when item removed
- emits even when item changed
- emits even when items cleared

- getItem(filter) - gets a single item (using filter/index/etc.)
- getItems(filter) - gets multiple items (using filter)
- addItem(item, options) - adds a single item
- addItems(items, options) - adds multiple items
- removeItem(item, options) - removes a single item
- clear(options) - remove all items

## render (Object)

A render contains the information about an element drawn on the screen
(element, transform, animateOptions).

- is a plain Object
- has an element (DOM)
- has a "transform" object (properties to animate)
- has "animateOptions" object (options for animation)

## transform (Object)

A transform represents the DOM element properties that have been applied to an
element.

- is a plain object
- has properties to apply in an animation

## animateOptions (Object)

An animateOptions represents the options applied during an animation
(duration, easing, etc.)

- is a plain object
- has options to apply in an animation

## Layout

A Layout is a passive object that knows how to create elements, create
transforms, etc.

- is an Object
- has an itemCollection
- has a viewport
- does not listen to itemCollection events (???)
- does not listen to viewport events (???)

- createRenderElements(item) - creates an element for a render
- loadRenderElement(item, render) - loads the contents of an element
- unloadRenderElement(item, render)  - unloads the contents of an element
- createRenderAnimation(item, render) - creates the "transform" and
  "animateOptions" for a render
- setItemCollection(itemCollection)
- setViewport(itemCollection)

## Viewport

A Viewport manages the DOM where the elements are drawn.  It delegates
to the Layout to determine how to create elements, and how to transform
them.  The viewport also listens for DOM events, and delegates to the
layout to determine how to handle them.

- is an EventEmitter
- has an ItemCollection
- has a Layout
- has a 2-dimensional array of "renders"
  - 1st level of indexes matches the itemCollection indexes one-to-one
  - 2nd level of indexes is the renders for the item
- emits events
  - UI events (touch/gestures)

- setItemCollection(itemCollection)
- setLayout(layout)
- draw() - draws all item render
- drawItem(item)
- drawItemRender(item, render)

## Deck

A Deck is the top-level object that the application will deal with.  It
manages all the objects, and provides the top-level API.

- is an Object
- has an ItemCollection
- has a Layout
- has a Viewport

- {wrappers for itemCollection methods - to modify collection}
- setItemCollection
- setLayout
- setViewport
