const readJSON = require('./functies/readJSON.js');
const readJSONSync = require('./functies/readJSONSync.js');
const updateAlles = require('./functies/updateAlles.js');
const legAfstand = require('./functies/legAfstand.js');
const dowloadData = require('./functies/dowloadData.js');
const haalDataOp = require('./functies/haalDataOp.js');
const vindStation = require('./functies/vindStation.js');
const stationAfstand = require('./functies/stationAfstand.js');

const stations = readJSONSync("stations").payload;
const config = readJSONSync("config");

const startDatum = new Date(config.startmoment);
const eindDatum = new Date(startDatum.getTime() + config.speelduur_minuten * 60 * 1000);

const berekenRitjes = async (aankomstTijd, station, negeerbareFeaturesReferentie, huidigeAfstand, routeTotNuToe) => {
    let negeerbareFeatures = [...negeerbareFeaturesReferentie];
    const vroegsteVertrektijd = new Date(aankomstTijd.getTime() + config.minimum_overstaptijd_seconden * 1000);
    if (vroegsteVertrektijd > eindDatum) return console.log(huidigeAfstand, routeTotNuToe);

    let ritjes = {};

    while (!ritjes.payload) {
        ritjes = await dowloadData(`/reisinformatie-api/api/v2/departures?station=${station}&dateTime=${vroegsteVertrektijd.toISOString()}&maxJourneys=${config.max_journeys_per_station}`, 'temp');
    }

    let berekendeVertrekken = [];

    if (!ritjes) return console.log(ritjes);

    ritjes.payload.departures
        .filter((rit) => config.toegestane_treintypen.includes(rit.trainCategory))
        .filter((rit) => !berekendeVertrekken.includes(rit.direction)) // doet niets???
        .filter((rit) => (new Date(rit.plannedDateTime) - aankomstTijd) / 1000 <= config.maximum_overstaptijd_seconden)
        .forEach(async (rit) => {
            if (berekendeVertrekken.includes(rit.direction)) return;
            berekendeVertrekken.push(rit.direction);
            const volledigeBestemming = vindStation(rit.direction);
            const volledigeritRaw = await dowloadData(`/reisinformatie-api/api/v3/trips?fromStation=${station}&toStation=${volledigeBestemming.code}&dateTime=${rit.plannedDateTime}&yearCard=true&passing=true`, 'tempritje');
            if (!volledigeritRaw.trips) return;
            if (volledigeritRaw.trips[0].legs.length > 1) return console.log("===========MORE THAN ONE LEG=============");
            const volledigeRitLeg = volledigeritRaw.trips[0].legs[0];

            let vorigeStationCode = "";
            let afstand = huidigeAfstand;

            volledigeRitLeg.stops.forEach((station, index) => {
                // console.log(station.name);
                const huidigStation = vindStation(station.name);
                if (!huidigStation) return;
                
                // if (volledigStation.land == "D") afstand = -10000;
                
                if (index == 0) {
                    vorigeStationCode = huidigStation.code;
                    return;
                }
                
                afstand += stationAfstand(vorigeStationCode, huidigStation.code, negeerbareFeatures);

                // er wordt op het station gestopt
                if (!station.passing) {
                    berekenRitjes(new Date(station.plannedArrivalDateTime), huidigStation.code, negeerbareFeatures, afstand, [...routeTotNuToe, station.name]);
                }

                vorigeStationCode = huidigStation.code;
            });

            // console.log(rit.direction, rit.plannedDateTime);
        });
};

berekenRitjes(new Date(), 'AMF', [], 0, []);

