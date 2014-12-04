var _ = require("lodash");

module.exports = (function getBrowserInfo() {
  var userAgent = window.navigator.userAgent;
  var msieIndex = userAgent.indexOf("MSIE ");
  var tridentIndex = userAgent.indexOf("Trident/");

  var msieVersion = -1;
  if (msieIndex > 0) {
    msieVersion = _.parseInt(userAgent.substring(msieIndex + 5, userAgent.indexOf(".", msieIndex)));
  } else if (tridentIndex > 0) {
    var rvIndex = userAgent.indexOf("rv:");
    msieVersion = _.parseInt(userAgent.substring(rvIndex + 3, userAgent.indexOf(".", rvIndex)));
  }

  // TODO: this is not a very robust check
  var isMobile = !!window.cordova ||
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

  return {
    isMobile: isMobile,
    isDesktop: !isMobile,
    isIE: _.isNumber(msieVersion) && msieVersion >= 0,
    isIE8: msieVersion === 8,
    isIE9: msieVersion === 9,
    isIE10: msieVersion === 10,
    isIE11: msieVersion === 11,
    isIE8OrGreater: msieVersion >= 8,
    isIE9OrGreater: msieVersion >= 9,
    isIE10OrGreater: msieVersion >= 10,
    isIE11OrGreater: msieVersion >= 11
  };
}());

