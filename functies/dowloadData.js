const fs = require("fs");
const path = require("path");
const haalDataOp = require('./haalDataOp.js');

module.exports = async (pad, locatie) => {
    const data = await haalDataOp(pad);
    if (locatie != null) await fs.promises.writeFile(path.join("opslag", locatie + ".json"), JSON.stringify(data));
    return data;
};
