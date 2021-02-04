const fs = require("fs");
const path = require("path");
const haalDataOp = require('./haalDataOp.js');
const wacht = require('./wacht.js');

module.exports = async (pad, locatie) => {
    let data;

    while (true) {
        data = await haalDataOp(pad);

        if (data.statusCode == 429) {
            console.log("ratelimit");
            await wacht(100);
            continue;
        } else if (data.statusCode == 38) {
            continue;
        } else {
            break;
        }
    }

    if (locatie != null) await fs.promises.writeFile(path.join("opslag", locatie + ".json"), JSON.stringify(data));

    return data;
};
