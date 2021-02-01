const dowloadData = require('./dowloadData.js');

module.exports = async () => {
    dowloadData('/Spoorkaart-API/api/v1/spoorkaart/', 'spoorkaart');
    dowloadData('/reisinformatie-api/api/v2/stations', 'stations');
    // dowloadData('/reisinformatie-api/api/v2/arrivals?maxJourneys=1000&station=UT', config.aankomsten_locatie);
    // dowloadData('/reisinformatie-api/api/v2/departures?maxJourneys=1000&station=UT', config.vertrekken_locatie);
};