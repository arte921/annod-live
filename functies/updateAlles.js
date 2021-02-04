const dowloadData = require('./dowloadData.js');
const writeJSON = require('./writeJSON.js');

module.exports = async () => {
    dowloadData('/Spoorkaart-API/api/v1/spoorkaart/', 'spoorkaart');
    dowloadData('/reisinformatie-api/api/v2/stations', 'stations');
    writeJSON('reiscache', {});
    writeJSON('stationcache', {});
};