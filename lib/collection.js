var _ = require("lodash");

var Collection = function(options) {
  if (!(this instanceof Collection)) { return new Collection(options); }
  this.options = options;
};

_.extend(Collection.prototype, {
});

module.exports = Collection;
