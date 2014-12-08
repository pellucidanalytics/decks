(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./examples/polyfills/index.js":[function(require,module,exports){
//require("es5-shim-sham");
require("./stringtrim");
require("./arrayisarray");

},{"./arrayisarray":"/Users/awhite/dev/pellucidanalytics/decks/examples/polyfills/arrayisarray.js","./stringtrim":"/Users/awhite/dev/pellucidanalytics/decks/examples/polyfills/stringtrim.js"}],"/Users/awhite/dev/pellucidanalytics/decks/examples/polyfills/arrayisarray.js":[function(require,module,exports){
if (!Array.isArray) {
  Array.isArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
}

},{}],"/Users/awhite/dev/pellucidanalytics/decks/examples/polyfills/stringtrim.js":[function(require,module,exports){
/* jshint freeze:false */
if (!String.prototype.trim) {
  (function(){
    // Make sure we trim BOM and NBSP
    var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
    String.prototype.trim = function () {
      return this.replace(rtrim, "");
    };
  })();
}

},{}]},{},["./examples/polyfills/index.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJleGFtcGxlcy9wb2x5ZmlsbHMvaW5kZXguanMiLCJleGFtcGxlcy9wb2x5ZmlsbHMvYXJyYXlpc2FycmF5LmpzIiwiZXhhbXBsZXMvcG9seWZpbGxzL3N0cmluZ3RyaW0uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvL3JlcXVpcmUoXCJlczUtc2hpbS1zaGFtXCIpO1xucmVxdWlyZShcIi4vc3RyaW5ndHJpbVwiKTtcbnJlcXVpcmUoXCIuL2FycmF5aXNhcnJheVwiKTtcbiIsImlmICghQXJyYXkuaXNBcnJheSkge1xuICBBcnJheS5pc0FycmF5ID0gZnVuY3Rpb24oYXJnKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcmcpID09PSAnW29iamVjdCBBcnJheV0nO1xuICB9O1xufVxuIiwiLyoganNoaW50IGZyZWV6ZTpmYWxzZSAqL1xuaWYgKCFTdHJpbmcucHJvdG90eXBlLnRyaW0pIHtcbiAgKGZ1bmN0aW9uKCl7XG4gICAgLy8gTWFrZSBzdXJlIHdlIHRyaW0gQk9NIGFuZCBOQlNQXG4gICAgdmFyIHJ0cmltID0gL15bXFxzXFx1RkVGRlxceEEwXSt8W1xcc1xcdUZFRkZcXHhBMF0rJC9nO1xuICAgIFN0cmluZy5wcm90b3R5cGUudHJpbSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlcGxhY2UocnRyaW0sIFwiXCIpO1xuICAgIH07XG4gIH0pKCk7XG59XG4iXX0=
