module.exports = {
  RED_FG: "color: #ff0000",
  GREEN_FG: "color: #00ff00",
  BLUE_FG: "color: #0000ff",

  RED_BG: "background-color: #ff0000; color: #ffffff",
  GREEN_BG: "background-color: #00ff00; color: #ffffff",
  BLUE_BG: "background-color: #0000ff; color: #ffffff",

  red: function(message) {
    console.log("%c " + message, this.RED_BG);
  },

  green: function(message) {
    console.log("%c " + message, this.GREEN_BG);
  },

  blue: function(message) {
    console.log("%c " + message, this.BLUE_BG);
  }
};
