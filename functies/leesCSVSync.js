const fs = require("fs");
const path = require("path");

module.exports = (locatie) => fs.readFileSync(path.join("ns-latest", locatie + ".dat"))
    .toString()
    .split(/\r?\n/)
    .map((entry) => entry.split(/,\s*/));