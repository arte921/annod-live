const readJSONSync = require('./readJSONSync.js');
const writeJSON = require('./writeJSON.js');
const dowloadData = require('./dowloadData.js');

const config = readJSONSync("config");
const stationCache = readJSONSync("stationcache");

module.exports = async (station) => {
    let ritjes = {};

    if (stationCache[station]) {
        ritjes = stationCache[station];
    } else {
        const rawRitjes = await dowloadData(`/reisinformatie-api/api/v2/departures?station=${station}&maxJourneys=${config.max_journeys_per_station}`);
        if (!rawRitjes.payload) console.log("================= GEEN RAWRITJES PAYLOAD =================")
        ritjes = rawRitjes.payload;
        stationCache[station] = ritjes;
        writeJSON(stationCache, "stationcache");
    }

    return ritjes;
};