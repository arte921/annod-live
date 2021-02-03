const fs = require("fs");
const path = require("path");

module.exports = (input, locatie) => fs.writeFileSync(path.join("opslag", locatie + ".json"), JSON.stringify(input));