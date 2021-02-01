const readJSON = require('./functies/readJSON.js');
const readJSONSync = require('./functies/readJSONSync.js');
const updateAlles = require('./functies/updateAlles.js');
const legAfstand = require('./functies/legAfstand.js');
const dowloadData = require('./functies/dowloadData.js');
const haalDataOp = require('./functies/haalDataOp.js');
const vindStation = require('./functies/vindStation.js');

const stations = readJSONSync("stations").payload;
const config = readJSONSync("config");

const berekenRitjes = async (aankomstTijd, station) => {
    const vroegsteVertrektijd = new Date(aankomstTijd.getTime() + config.minimum_overstaptijd_seconden * 1000);

    const ritjes = await dowloadData(`/reisinformatie-api/api/v2/departures?station=${station}&dateTime=${vroegsteVertrektijd.toISOString()}&maxJourneys=${config.max_journeys_per_station}`, 'temp');
    // const ritjes = await readJSON('temp');

    let berekendeVertrekken = [];

    ritjes.payload.departures
        .filter((rit) => config.toegestane_treintypen.includes(rit.trainCategory))
        .filter((rit) => !berekendeVertrekken.includes(rit.direction))
        .filter((rit) => (new Date(rit.plannedDateTime) - aankomstTijd) / 1000 <= config.maximum_overstaptijd_seconden)
        .forEach(async (rit) => {
            if (!berekendeVertrekken.includes(rit.direction)) console.log("E");
            berekendeVertrekken.push(rit.direction);
            console.log(berekendeVertrekken, rit.direction, rit.plannedDateTime);
            // console.log(rit.direction, rit.plannedDateTime);
            const volledigeBestemming = vindStation(rit.direction);
            const volledigerit = (await dowloadData(`/reisinformatie-api/api/v3/trips?fromStation=${station}&toStation=${volledigeBestemming.code}&dateTime=${rit.plannedDateTime}&yearCard=true&passing=true`, 'tempritje')).trips[0];
            if (volledigerit.legs.length > 1) return console.log("===========MORE THAN ONE LEG=============");
            // console.log(legAfstand(volledigerit.legs[0]), rit.direction, rit.plannedDateTime);
        });
};

berekenRitjes(new Date("2021-02-01T17:53:00+0100"), 'AH');

