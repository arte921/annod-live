const dowloadData = require('./dowloadData.js');
const writeJSON = require('./writeJSON.js');

module.exports = async () => {
    await dowloadData('/Spoorkaart-API/api/v1/spoorkaart/', 'spoorkaart');
    await dowloadData('/reisinformatie-api/api/v2/stations', 'stations');
    await writeJSON({}, "reiscache");
    await writeJSON({}, "stationcache");
};