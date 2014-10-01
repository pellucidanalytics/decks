module.exports.groups = [{
    name: "fruits",
    tags: ["berries", "melons", "citrus", "drupes"]
}, {
    name: "vegetables",
    tags: ["roots", "stalks", "leaves"]
}, {
    name: "grains",
    tags: ["refined", "whole"]
}];

var fruits = [{
    name: "Strawberry",
    imgUrl: "http://lorempixel.com/",
    tags: ["berries"]
}, {
    name: "Blueberry",
    imgUrl: "http://lorempixel.com/",
    tags: ["berries"]
}, {
    name: "Raspberry",
    imgUrl: "http://lorempixel.com/",
    tags: ["berries"]
}, {
    name: "Blackberry",
    imgUrl: "http://lorempixel.com/",
    tags: ["berries"]
}, {
    name: "Huckleberry",
    imgUrl: "http://lorempixel.com/",
    tags: ["berries"]
}, {
    name: "Watermelon",
    imgUrl: "http://lorempixel.com/",
    tags: ["melons"]
}, {
    name: "Cantaloupe",
    imgUrl: "http://lorempixel.com/",
    tags: ["melons"]
}, {
    name: "Honeydew",
    imgUrl: "http://lorempixel.com/",
    tags: ["melons"]
}, {
    name: "Orange",
    imgUrl: "http://lorempixel.com/",
    tags: ["citrus"]
}, {
    name: "Mandarin Orange",
    imgUrl: "http://lorempixel.com/",
    tags: ["citrus"]
}, {
    name: "Kumquat",
    imgUrl: "http://lorempixel.com/",
    tags: ["citrus"]
}, {
    name: "Lemon",
    imgUrl: "http://lorempixel.com/",
    tags: ["citrus"]
}, {
    name: "Lime",
    imgUrl: "http://lorempixel.com/",
    tags: ["citrus"]
}, {
    name: "Tangelo",
    imgUrl: "http://lorempixel.com/",
    tags: ["citrus"]
}, {
    name: "Grapefruit",
    imgUrl: "http://lorempixel.com/",
    tags: ["citrus"]
}, {
    name: "Pomelo",
    imgUrl: "http://lorempixel.com/",
    tags: ["citrus"]
}, {
    name: "Peach",
    imgUrl: "http://lorempixel.com/",
    tags: ["drupes"]
}, {
    name: "Plum",
    imgUrl: "http://lorempixel.com/",
    tags: ["drupes"]
}, {
    name: "Cherry",
    imgUrl: "http://lorempixel.com/",
    tags: ["drupes"]
}, {
    name: "Olive",
    imgUrl: "http://lorempixel.com/",
    tags: ["drupes"]
}, {
    name: "Nectarine",
    imgUrl: "http://lorempixel.com/",
    tags: ["drupes"]
}];

var vegetables = [{
    name: "Carrot",
    imgUrl: "http://lorempixel.com/",
    tags: ["roots"]
}, {
    name: "Onion",
    imgUrl: "http://lorempixel.com/",
    tags: ["roots"]
}, {
    name: "Garlic",
    imgUrl: "http://lorempixel.com/",
    tags: ["roots"]
}, {
    name: "Yam",
    imgUrl: "http://lorempixel.com/",
    tags: ["roots"]
}, {
    name: "Ginger",
    imgUrl: "http://lorempixel.com/",
    tags: ["roots"]
}, {
    name: "Beet",
    imgUrl: "http://lorempixel.com/",
    tags: ["roots"]
}, {
    name: "Rutabega",
    imgUrl: "http://lorempixel.com/",
    tags: ["roots"]
}, {
    name: "Potato",
    imgUrl: "http://lorempixel.com/",
    tags: ["roots"]
}, {
    name: "Yuca",
    imgUrl: "http://lorempixel.com/",
    tags: ["roots"]
}, {
    name: "Fennel",
    imgUrl: "http://lorempixel.com/",
    tags: ["roots", "stalks"]
}, {
    name: "Celery",
    imgUrl: "http://lorempixel.com/",
    tags: ["stalks"]
}, {
    name: "Asparagus",
    imgUrl: "http://lorempixel.com/",
    tags: ["stalks"]
}, {
    name: "Spinach",
    imgUrl: "http://lorempixel.com/",
    tags: ["leaves"]
}, {
    name: "Kale",
    imgUrl: "http://lorempixel.com/",
    tags: ["leaves"]
}, {
    name: "Cilantro",
    imgUrl: "http://lorempixel.com/",
    tags: ["leaves"]
}, {
    name: "Chard",
    imgUrl: "http://lorempixel.com/",
    tags: ["leaves"]
}, {
    name: "Bok Choi",
    imgUrl: "http://lorempixel.com/",
    tags: ["leaves"]
}, {
    name: "Cabbage",
    imgUrl: "http://lorempixel.com/",
    tags: ["leaves"]
}, {
    name: "Basil",
    imgUrl: "http://lorempixel.com/",
    tags: ["leaves"]
}];

var grains = [{
    name: "White Rice",
    imgUrl: "http://lorempixel.com/",
    tags: ["refined"]
}, {
    name: "White Flour",
    imgUrl: "http://lorempixel.com/",
    tags: ["refined"]
}, {
    name: "Whole Flour",
    imgUrl: "http://lorempixel.com/",
    tags: ["whole"]
}, {
    name: "Brown Rice",
    imgUrl: "http://lorempixel.com/",
    tags: ["whole"]
}, {
    name: "Oatmeal",
    imgUrl: "http://lorempixel.com/",
    tags: ["whole"]
}];

module.exports.foods = fruits.concat(vegetables).concat(grains);
