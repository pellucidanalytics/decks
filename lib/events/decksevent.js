function DecksEvent(type, sender, data) {
  if (!(this instanceof DecksEvent)) { return new DecksEvent(type, sender, data); }
  if (!type) { throw new Error("type is required"); }
  if (!sender) { throw new Error("sender is required"); }
  this.type = type;
  this.sender = sender;
  this.data = data || {};
}

module.exports = DecksEvent;
