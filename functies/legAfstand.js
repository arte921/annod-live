const stationAfstand = require('./stationAfstand.js');
const vindStation = require('./vindStation.js');

module.exports = (leg, negeerbareFeatures) => {
    let vorigStation = "";
    let afstand = 0;

    leg.stops.forEach((station, index) => {
        const volledigStation = vindStation(station.name);
        // if (volledigStation.land == "D") afstand = -10000;
        
        if (index != 0) {
            afstand += stationAfstand(vorigStation, volledigStation.code, negeerbareFeatures);
        }

        vorigStation = volledigStation.code;
    });

    return afstand;
}