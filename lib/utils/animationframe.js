// Based on:
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel

// MIT license

module.exports = (function() {
  var i;
  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  var now = Date.now || function() { return new Date().getTime(); };

  var request = window.requestAnimationFrame;
  var cancel = window.cancelAnimationFrame;

  for (i = 0; i < vendors.length && !request; ++i) {
      request = window[vendors[i]+'RequestAnimationFrame'];
      cancel = window[vendors[i]+'CancelAnimationFrame'] || window[vendors[i]+'CancelRequestAnimationFrame'];
  }

  if (request && !cancel){
    console.warn("requestAnimationFrame was found, but not cancelAnimationFrame");
  } else if (!request && cancel) {
    console.warn("requestAnimationFrame was found, but not cancelAnimationFrame");
  }

  if (!request) {
    request = function(callback) {
      var currTime = now();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function() { callback(currTime + timeToCall); },
        timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }

  if (!cancel) {
      cancel = function(id) {
          clearTimeout(id);
      };
  }

  return {
    request: request,
    cancel: cancel
  };
}());
