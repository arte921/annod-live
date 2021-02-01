const fs = require("fs");
const path = require("path");

module.exports = async (locatie) => JSON.parse(
    await fs.promises.readFile(path.join("opslag", locatie + ".json"))
);