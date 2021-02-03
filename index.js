const readJSON = require('./functies/readJSON.js');
const readJSONSync = require('./functies/readJSONSync.js');
const updateAlles = require('./functies/updateAlles.js');
const legAfstand = require('./functies/legAfstand.js');
const dowloadData = require('./functies/dowloadData.js');
const haalDataOp = require('./functies/haalDataOp.js');
const vindStation = require('./functies/vindStation.js');
const stationAfstand = require('./functies/stationAfstand.js');
const writeJSONSync = require('./functies/writeJSONSync.js');

const config = readJSONSync("config");

const startDatum = new Date(config.startmoment);
const eindDatum = new Date(startDatum.getTime() + config.speelduur_minuten * 60 * 1000);

let kandidaatRoutes = [];

const berekenRitjes = async (aankomstTijd, station, negeerbareFeaturesReferentie, huidigeAfstand, routeTotNuToe) => {
    let negeerbareFeatures = [...negeerbareFeaturesReferentie];
    const vroegsteVertrektijd = new Date(aankomstTijd.getTime() + config.minimum_overstaptijd_seconden * 1000);

    // console.log(huidigeAfstand, routeTotNuToe, aankomstTijd);
    if (vroegsteVertrektijd > eindDatum) {
        kandidaatRoutes.push({
            afstand: huidigeAfstand,
            route: routeTotNuToe,
            eindtijd: aankomstTijd
        });
        return console.log("EEE", huidigeAfstand, routeTotNuToe, aankomstTijd)
    }

    let ritjes = {};

    while (!ritjes.payload) {
        // dateTime niet meer ondersteund voor binnenlandse stations??
        ritjes = await dowloadData(`/reisinformatie-api/api/v2/departures?station=${station}&dateTime=${vroegsteVertrektijd.toISOString()}&maxJourneys=${config.max_journeys_per_station}`, 'temp');
    }

    let berekendeVertrekken = [];

    ritjes.payload.departures
        .filter((rit) => config.toegestane_treintypen.includes(rit.trainCategory))
        .filter((rit) => !berekendeVertrekken.includes(rit.direction)) // doet niets???
        // .filter((rit) => (new Date(rit.plannedDateTime) - aankomstTijd) / 1000 <= config.maximum_overstaptijd_seconden)
        .forEach(async (rit) => {
            if (berekendeVertrekken.includes(rit.direction)) return;
            berekendeVertrekken.push(rit.direction);
            const volledigeBestemming = vindStation(rit.direction);
            const volledigeritRaw = await dowloadData(`/reisinformatie-api/api/v3/trips?fromStation=${station}&toStation=${volledigeBestemming.code}&dateTime=${vroegsteVertrektijd.toISOString()}&yearCard=true&passing=true`, 'tempritje');
            if (!volledigeritRaw.trips) return;
            if (volledigeritRaw.trips[0].legs.length > 1) return; // console.log("===========MORE THAN ONE LEG=============");
            const volledigeRitLeg = volledigeritRaw.trips[0].legs[0];

            let vorigeStationCode = "";
            let afstand = huidigeAfstand;

            volledigeRitLeg.stops.forEach((station, index) => {
                const huidigStation = vindStation(station.name);
                if (!huidigStation) return;

                if (index == 0) {
                    vorigeStationCode = huidigStation.code;
                    return;
                }
                
                if (huidigStation.land == "D") return;
                
                afstand += stationAfstand(vorigeStationCode, huidigStation.code, negeerbareFeatures);

                // er wordt op het station gestopt
                if (!station.passing) {
                    berekenRitjes(new Date(station.plannedArrivalDateTime), huidigStation.code, negeerbareFeatures, afstand, [...routeTotNuToe, station.name]);
                }

                vorigeStationCode = huidigStation.code;
            });
        });
};

(async () => {
    await berekenRitjes(startDatum, config.start_station, [], 0, []);
    console.log("DONE", kandidaatRoutes.length);
    writeJSONSync(kandidaatRoutes, 'resultaat');
})();
