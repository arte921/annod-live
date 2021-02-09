const fs = require("fs");
const path = require("path");

module.exports = async (locatie) => (await fs.promises.readFile(path.join("opslag", locatie + ".csv")))
    .toString()
    .split(/\r?\n/)
    .map((entry) => entry.split(/,\s*/));