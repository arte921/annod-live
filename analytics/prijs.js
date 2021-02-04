const readJSONSync = require('./functies/readJSONSync.js');

const config = readJSONSync("config");
const reizen = readJSONSync('resultaat');
const vindStation = require('./functies/vindStation.js');

for (const reis in reizen.slice(0, 2)) {
    for (const [index, station] of reis.route.entries()) {
        const huidigStation = vindStation(station);

        if (index == 0) {
            vorigStation = vindStation(station).code;
            continue;
        }

        
        
        const volledigeritRaw = await dowloadData(`/reisinformatie-api/api/v3/trips?fromStation=${station}&toStation=${volledigeBestemming.code}&dateTime=${vroegsteVertrektijd.toISOString()}&yearCard=true&passing=true`);

    }
}