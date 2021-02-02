const readJSONSync = require('./readJSONSync.js');
const stations = readJSONSync("stations").payload;

module.exports = (stationsNaam) => 
    stations.find((kandidaatStation) => kandidaatStation.namen.lang == stationsNaam) ||
    stations.find((kandidaatStation) => kandidaatStation.synoniemen.includes(stationsNaam)) ||
    console.log("Geen station gevonden voor " + stationsNaam);