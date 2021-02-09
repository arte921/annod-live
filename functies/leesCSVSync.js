const fs = require("fs");
const path = require("path");

module.exports = (locatie) => fs.readFileSync(path.join("opslag", locatie + ".csv"))
    .toString()
    .split(/\r?\n/)
    .map((entry) => entry.split(/,\s*/));