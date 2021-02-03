const fs = require("fs");
const path = require("path");
const haalDataOp = require('./haalDataOp.js');

module.exports = async (pad, locatie) => {
    let data;
    do {
        data = await haalDataOp(pad);
    } while ((data.statusCode == 429));

    if (locatie != null) await fs.promises.writeFile(path.join("opslag", locatie + ".json"), JSON.stringify(data));
    return data;
};
