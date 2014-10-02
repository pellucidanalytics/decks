var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");

function Layout(options) {
  if (!(this instanceof Layout)) { return new Layout(options); }
  EventEmitter.call(this);
}

inherits(Layout, EventEmitter);

_.extend(Layout.prototype, {
  getRenders: function(item, index) {
  },

  loadRender: function(options) {
  },

  unloadRender: function(options) {
  },

  setViewport: function(viewport) {
  },

  setItemCollection: function(itemCollection) {
  }
});

module.exports = Layout;
