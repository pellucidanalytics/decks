---
layout: index
title: decks
---

### Overview

decks provides a set of classes and utilities for rendering collections of items
in the DOM.  decks allows you to define "Layouts" for rendering your items,
and provides all the rendering, animation, and touch/gesture support for seamlessly
transitioning between layouts, and interacting with your content.

### Documentation

- [JSDoc API documentation]({{ site.path}}/dist/jsdoc) is generated from the source code.

The decks system defines the following concepts:

- **Deck** - the main entry point and initializer of the decks infrastructure.
- **Item** - a model type which stores any arbitrary JavaScript data, and provides
a basic event API for notifying changes to the data.
- **ItemCollection** - a collection type that stores **Item** instances, and provides
a basic event API for notifying changes to the collection.
- **Layout** - a type which is responsible for determining where items should be rendered,
how they should be animated, and which types of gestures/events should be activated.
- **Frame** - a type which manages a DOM element in a page, where the decks system is made
visible.  The frame defines the visual bounds in which the decks renders can be seen.
- **Canvas** - a type which manages another DOM element that is placed within the Frame element.
The Canvas element is the "canvas" in which your DOM items are drawn.  The Canvas can move within
the bounds of the Frame, and can interact with the Frame bounds, for things like springy edges, and
snapping-to-bounds.
- **Viewport** - the decks Viewport is the main coordinator for DOM drawing and animations.  The
Viewport manages the Frame and Canvas elements, and delegates to a Layout instance to determine
where item elements are drawn, and for transitioning between different visual states or Layouts.

### Examples

- [Multi-function test/demo]({{ site.path }}/dist/examples/multi)
- [Layout test]({{ site.path }}/dist/examples/sparse)
- [Another layout test]({{ site.path }}/dist/examples/stacked)

### Developers

View the [README](https://github.com/pellucidanalytics/decks) for development/contribution
information.

### Current Build Status

[![Build Status](http://img.shields.io/travis/pellucidanalytics/decks.svg)](https://travis-ci.org/pellucidanalytics/decks)

[![npm version](http://img.shields.io/npm/v/decks.svg)](https://www.npmjs.org/package/decks)
[![Dependency Status](http://img.shields.io/david/pellucidanalytics/decks.svg)](https://david-dm.org/pellucidanalytics/decks)
[![devDependency Status](http://img.shields.io/david/dev/pellucidanalytics/decks.svg)](https://david-dm.org/pellucidanalytics/decks#info=devDependencies)
[![npm license](http://img.shields.io/npm/l/decks.svg)](https://www.npmjs.org/package/decks)

[![Sauce Test Status](https://saucelabs.com/browser-matrix/pelluciddecks.svg?auth=ece3dc76af60a49515da2a7b0bbfa51c)](https://saucelabs.com/u/pelluciddecks?auth=ece3dc76af60a49515da2a7b0bbfa51c)

## Inspirations

- [Tremula](https://github.com/garris/TremulaJS)
- [Stapel](http://tympanus.net/Development/Stapel/)
- [gridster.js](http://gridster.net/)
- [jquery.shapeshift](http://mcpants.github.io/jquery.shapeshift/)
- [jQuery Nested](http://suprb.com/apps/nested/)
- [Free Wall](http://vnjs.net/www/project/freewall/)
- [Shuffle](http://vestride.github.io/Shuffle/)
- [Loading Effects for Grid Items](http://tympanus.net/Development/GridLoadingEffects/index.html)
- [Magnet](http://codecanyon.net/item/magnet-jquery-plugin-for-filterable-layouts/full_screen_preview/7550966?ref=jqueryrain)
- [jQuery Gridly](http://ksylvest.github.io/jquery-gridly/)
