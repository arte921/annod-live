const readJSONSync = require('./readJSONSync.js');
const writeJSON = require('./writeJSON.js');
const dowloadData = require('./dowloadData.js');

const config = readJSONSync("config");
const cache = readJSONSync("reiscache");

setTimeout((async () => await writeJSON(cache, "reiscache")), 1000);

module.exports = async (beginStation, eindStation, vertrekTijd) => {
    const vertrekTijdDate = new Date(vertrekTijd);
    const id = beginStation + eindStation + vertrekTijdDate.getHours() + vertrekTijdDate.getMinutes() + vertrekTijdDate.getSeconds();

    if (cache[id]) return cache[id];

    let ritjes = {};

    ritjes = await dowloadData(`/reisinformatie-api/api/v3/trips?fromStation=${beginStation}&toStation=${eindStation}&dateTime=${vertrekTijd}&yearCard=true&passing=true`);
    cache[id] = ritjes;

    return ritjes;
};