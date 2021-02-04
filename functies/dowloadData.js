const fs = require("fs");
const path = require("path");
const haalDataOp = require('./haalDataOp.js');
const wacht = require('./wacht.js');
const readJSONSync = require('./readJSONSync.js');
const writeJSON = require('./writeJSON.js');

const config = readJSONSync("config");

let lopendeRequests = 0;

let ratelimits = 0;
let succesvolleRequests = 0;
let preCachedRequest = 0;

let cache = readJSONSync("cache");

setTimeout((() => writeJSON(cache, "cache")), 1000);

module.exports = async (pad, locatie) => {
    let data;

    if (cache[pad]) {
        preCachedRequest++;
        return cache[pad];
    }

    while (true) {
        if (lopendeRequests >= config.maximum_requests_per_tijdseenheid) {
            // wacht tot weer een request kan worden gestuurd
            await wacht(config.ratelimit_wachttijd_milliseconden_preventief);
            continue;
        }

        lopendeRequests++;
        setTimeout((() => lopendeRequests--), config.ratelimit_tijdseenheid_milliseconden);

        data = await haalDataOp(pad);

        if (data.statusCode == 429) {
            // NS geeft ratelimit aan
            ratelimits++;
            if (ratelimits % 100 == 0) console.log(`${ratelimits} keer geratelimit, ${succesvolleRequests} keer doorgelaten, ${preCachedRequest} keer uit cache opgehaald`);
            await wacht(config.ratelimit_wachttijd_milliseconden_curatief);
            continue;
        } else if (data.statusCode == 38) {
            // http error in client wordt 38 teruggestuurd door haalDataOp
            continue;
        } else if (data.code == 400) {
            console.log("bad request!", pad);
        } else {
            // request succesvol afgerond
            succesvolleRequests++;
            cache[pad] = data;
            break;
        }
    }

    if (locatie != null) await fs.promises.writeFile(path.join("opslag", locatie + ".json"), JSON.stringify(data));

    return data;
};
