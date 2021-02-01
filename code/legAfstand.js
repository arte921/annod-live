const readJSONSync = require('./readJSONSync.js');
const stationAfstand = require('./stationAfstand.js');

const stations = readJSONSync("stations").payload;

module.exports = (leg) => {
    let vorigStation = "";
    let afstand = 0;

    leg.stops.forEach((station, index) => {
        const volledigStation = stations.find((kandidaatStation) => kandidaatStation.namen.lang == station.name);
        
        if (index != 0) {
            afstand += stationAfstand(vorigStation, volledigStation.code);
        }

        console.log(volledigStation.code);

        vorigStation = volledigStation.code;
    });

    return afstand;
}