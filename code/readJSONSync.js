const fs = require("fs");
const path = require("path");

module.exports = (locatie) => JSON.parse(
    fs.readFileSync(path.join("opslag", locatie + ".json"))
);