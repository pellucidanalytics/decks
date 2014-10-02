var totalImages = 10,
    totalCards  = 20,
    images = [],
    list   = [];

for(var i = 0; i < totalImages; i++) {
    images.push('http://lorempixel.com/400/300/?'+Math.random());
}

for(var i = 0; i < totalCards; i++) {
    list.push({
        url : images[Math.floor(totalImages * Math.random())]
    });
}

console.log(list[0]);

module.exports.list = list;
