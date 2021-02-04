const readJSONSync = require('./readJSONSync.js');
const stations = readJSONSync("stations").payload;

module.exports = (stationsNaam) => stations.find((kandidaatStation) => kandidaatStation.code == stationsNaam);