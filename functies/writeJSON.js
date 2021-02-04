const fs = require("fs");
const path = require("path");

module.exports = async (input, locatie) => await fs.promises.writeFile(path.join("opslag", locatie + ".json"), JSON.stringify(input));