const readJSON = require('./functies/readJSON.js');
const readJSONSync = require('./functies/readJSONSync.js');
const updateAlles = require('./functies/updateAlles.js');
const legAfstand = require('./functies/legAfstand.js');
const dowloadData = require('./functies/dowloadData.js');
const haalDataOp = require('./functies/haalDataOp.js');
const vindStation = require('./functies/vindStation.js');

const stations = readJSONSync("stations").payload;
const config = readJSONSync("config");

const berekenRitjes = async (moment, station) => {
    const ritjes = await dowloadData(`/reisinformatie-api/api/v2/departures?station=${station}&dateTime=${moment.toISOString()}&maxJourneys=${config.max_journeys_per_station}`, 'temp');
    const ritjes = readJSON('temp');
    ritjes.payload.departures
    .filter((rit) => {
        let overstaptijd = (new Date(rit.plannedDateTime) - moment) / 1000;
        return overstaptijd >= config.minimum_overstaptijd_seconden && overstaptijd <= config.maximum_overstaptijd_seconden
    })
    .filter((rit) => config.toegestane_treintypen.includes(rit.trainCategory))
    .forEach((rit) => {
        console.log(rit);
    });
};

berekenRitjes(new Date(), 'ASD');

