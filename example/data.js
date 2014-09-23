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
    imgUrl: "img/fruit/strawberry.png",
    tags: ["berries"]
}, {
    name: "Blueberry",
    imgUrl: "img/fruit/blueberry.png",
    tags: ["berries"]
}, {
    name: "Raspberry",
    imgUrl: "img/fruit/raspberry.png",
    tags: ["berries"]
}, {
    name: "Blackberry",
    imgUrl: "img/fruit/blackberry.png",
    tags: ["berries"]
}, {
    name: "Huckleberry",
    imgUrl: "img/fruit/huckleberry.png",
    tags: ["berries"]
}, {
    name: "Watermelon",
    imgUrl: "img/fruit/watermelon.png",
    tags: ["melons"]
}, {
    name: "Cantaloupe",
    imgUrl: "img/fruit/cantaloupe.png",
    tags: ["melons"]
}, {
    name: "Honeydew",
    imgUrl: "img/fruit/honeydew.png",
    tags: ["melons"]
}, {
    name: "Orange",
    imgUrl: "img/fruit/orange.png",
    tags: ["citrus"]
}, {
    name: "Mandarin Orange",
    imgUrl: "img/fruit/mandarinorange.png",
    tags: ["citrus"]
}, {
    name: "Kumquat",
    imgUrl: "img/fruit/kumquat.png",
    tags: ["citrus"]
}, {
    name: "Lemon",
    imgUrl: "img/fruit/lemon.png",
    tags: ["citrus"]
}, {
    name: "Lime",
    imgUrl: "img/fruit/lime.png",
    tags: ["citrus"]
}, {
    name: "Tangelo",
    imgUrl: "img/fruit/tangelo.png",
    tags: ["citrus"]
}, {
    name: "Grapefruit",
    imgUrl: "img/fruit/grapefruit.png",
    tags: ["citrus"]
}, {
    name: "Pomelo",
    imgUrl: "img/fruit/pomelo.png",
    tags: ["citrus"]
}, {
    name: "Peach",
    imgUrl: "img/fruit/peach.png",
    tags: ["drupes"]
}, {
    name: "Plum",
    imgUrl: "img/fruit/plum.png",
    tags: ["drupes"]
}, {
    name: "Cherry",
    imgUrl: "img/fruit/cherry.png",
    tags: ["drupes"]
}, {
    name: "Olive",
    imgUrl: "img/fruit/olive.png",
    tags: ["drupes"]
}, {
    name: "Nectarine",
    imgUrl: "img/fruit/nectarine.png",
    tags: ["drupes"]
}];

var vegetables = [{
    name: "Carrot",
    imgUrl: "img/vegetable/carrot.png",
    tags: ["roots"]
}, {
    name: "Onion",
    imgUrl: "img/vegetable/onion.png",
    tags: ["roots"]
}, {
    name: "Garlic",
    imgUrl: "img/vegetable/garlic.png",
    tags: ["roots"]
}, {
    name: "Yam",
    imgUrl: "img/vegetable/yam.png",
    tags: ["roots"]
}, {
    name: "Ginger",
    imgUrl: "img/vegetable/ginger.png",
    tags: ["roots"]
}, {
    name: "Beet",
    imgUrl: "img/vegetable/beet.png",
    tags: ["roots"]
}, {
    name: "Rutabega",
    imgUrl: "img/vegetable/rutabega.png",
    tags: ["roots"]
}, {
    name: "Potato",
    imgUrl: "img/vegetable/potato.png",
    tags: ["roots"]
}, {
    name: "Yuca",
    imgUrl: "img/vegetable/yuca.png",
    tags: ["roots"]
}, {
    name: "Fennel",
    imgUrl: "img/vegetable/fennel.png",
    tags: ["roots", "stalks"]
}, {
    name: "Celery",
    imgUrl: "img/vegetable/celery.png",
    tags: ["stalks"]
}, {
    name: "Asparagus",
    imgUrl: "img/vegetable/asparagus.png",
    tags: ["stalks"]
}, {
    name: "Spinach",
    imgUrl: "img/vegetable/spinach.png",
    tags: ["leaves"]
}, {
    name: "Kale",
    imgUrl: "img/vegetable/kale.png",
    tags: ["leaves"]
}, {
    name: "Cilantro",
    imgUrl: "img/vegetable/cilantro.png",
    tags: ["leaves"]
}, {
    name: "Chard",
    imgUrl: "img/vegetable/chard.png",
    tags: ["leaves"]
}, {
    name: "Bok Choi",
    imgUrl: "img/vegetable/bokchoi.png",
    tags: ["leaves"]
}, {
    name: "Cabbage",
    imgUrl: "img/vegetable/cabbage.png",
    tags: ["leaves"]
}, {
    name: "Basil",
    imgUrl: "img/vegetable/basil.png",
    tags: ["leaves"]
}];

var grains = [{
    name: "White Rice",
    imgUrl: "img/grain/whiterice.png",
    tags: ["refined"]
}, {
    name: "White Flour",
    imgUrl: "img/grain/whiteflour.png",
    tags: ["refined"]
}, {
    name: "Whole Flour",
    imgUrl: "img/grain/wholeflour.png",
    tags: ["whole"]
}, {
    name: "Brown Rice",
    imgUrl: "img/grain/brownrice.png",
    tags: ["whole"]
}, {
    name: "Oatmeal",
    imgUrl: "img/grain/oatmeal.png",
    tags: ["whole"]
}];

module.exports.foods = fruits.concat(vegetables).concat(grains);
