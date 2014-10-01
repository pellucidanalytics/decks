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
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["berries"]
}, {
    name: "Blueberry",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["berries"]
}, {
    name: "Raspberry",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["berries"]
}, {
    name: "Blackberry",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["berries"]
}, {
    name: "Huckleberry",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["berries"]
}, {
    name: "Watermelon",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["melons"]
}, {
    name: "Cantaloupe",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["melons"]
}, {
    name: "Honeydew",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["melons"]
}, {
    name: "Orange",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["citrus"]
}, {
    name: "Mandarin Orange",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["citrus"]
}, {
    name: "Kumquat",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["citrus"]
}, {
    name: "Lemon",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["citrus"]
}, {
    name: "Lime",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["citrus"]
}, {
    name: "Tangelo",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["citrus"]
}, {
    name: "Grapefruit",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["citrus"]
}, {
    name: "Pomelo",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["citrus"]
}, {
    name: "Peach",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["drupes"]
}, {
    name: "Plum",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["drupes"]
}, {
    name: "Cherry",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["drupes"]
}, {
    name: "Olive",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["drupes"]
}, {
    name: "Nectarine",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["drupes"]
}];

var vegetables = [{
    name: "Carrot",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["roots"]
}, {
    name: "Onion",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["roots"]
}, {
    name: "Garlic",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["roots"]
}, {
    name: "Yam",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["roots"]
}, {
    name: "Ginger",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["roots"]
}, {
    name: "Beet",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["roots"]
}, {
    name: "Rutabega",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["roots"]
}, {
    name: "Potato",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["roots"]
}, {
    name: "Yuca",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["roots"]
}, {
    name: "Fennel",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["roots", "stalks"]
}, {
    name: "Celery",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["stalks"]
}, {
    name: "Asparagus",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["stalks"]
}, {
    name: "Spinach",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["leaves"]
}, {
    name: "Kale",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["leaves"]
}, {
    name: "Cilantro",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["leaves"]
}, {
    name: "Chard",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["leaves"]
}, {
    name: "Bok Choi",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["leaves"]
}, {
    name: "Cabbage",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["leaves"]
}, {
    name: "Basil",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["leaves"]
}];

var grains = [{
    name: "White Rice",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["refined"]
}, {
    name: "White Flour",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["refined"]
}, {
    name: "Whole Flour",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["whole"]
}, {
    name: "Brown Rice",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["whole"]
}, {
    name: "Oatmeal",
    imgUrl: "http://placekitten.com/g/300/200",
    tags: ["whole"]
}];

module.exports.foods = fruits.concat(vegetables).concat(grains);
