const readJSONSync = require('./readJSONSync.js');
const dowloadData = require('./dowloadData.js');

const config = readJSONSync("config");

const stationCache = {};

module.exports = async (station) => {
    let ritjes = {};

    if (stationCache[station]) {
        ritjes = stationCache[station];
    } else {
        let rawRitjes = {};
        while (!rawRitjes.payload) {
            console.log("download station " + station);
            rawRitjes = await dowloadData(`/reisinformatie-api/api/v2/departures?station=${station}&maxJourneys=${config.max_journeys_per_station}`, 'temp');
        }
        ritjes = rawRitjes.payload;
        stationCache[station] = ritjes;
    }

    return ritjes;
};