var Decks= require('..');

var myDeck = new Decks.Deck({
  viewport: new Decks.Viewport({/* ... options, obviously */}),
  layout: new Decks.Layout({
    getItemtransforms: function (item) {
      return {

      };
    }
  })
});

var items = [{
  toHTML: function (size) {
    return "<div>Some HTML</div>"
  }
}]

myDeck.addItems(items)

