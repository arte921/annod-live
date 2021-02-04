const readJSONSync = require('./readJSONSync.js');
const writeJSON = require('./writeJSON.js');
const dowloadData = require('./dowloadData.js');

const config = readJSONSync("config");
let cache = readJSONSync("reiscache");

let laatsteDownload = Date.now();

module.exports = async (beginStation, eindStation, vertrekTijd) => {
    const vertrekTijdDate = new Date(vertrekTijd);
    const id = vertrekTijdDate.getHours() + beginStation + vertrekTijdDate.getMinutes() + eindStation + vertrekTijdDate.getSeconds();

    if (cache[id]) return cache[id];

    let ritjes = await dowloadData(`/reisinformatie-api/api/v3/trips?fromStation=${beginStation}&toStation=${eindStation}&dateTime=${vertrekTijd}&yearCard=true&passing=true`);
    
    cache[id] = ritjes;

    const tijd = Date.now()
    if (tijd - laatsteDownload > 1000) {
        await writeJSON(cache, 'reiscache'); // corrupt bestand bij sigint
        laatsteDownload = tijd;
    }
    
    return ritjes;
};