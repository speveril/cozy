const fs = require('fs-extra');

var ex = {};
fs.readdirSync(__dirname).forEach((f) => {
    if (f === 'index.js' || f.slice(-3) !== ".js") return;
    ex[f.slice(0,-3)] = require(`./${f.slice(0,-3)}`);
});

module.exports = ex;
