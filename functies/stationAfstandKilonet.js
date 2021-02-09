const readJSONSync = require('./readJSONSync.js');
const coordinaatAfstand = require('./coordinaatAfstand.js');
const spoorkaart = readJSONSync("spoorkaart").payload.features;
const config = readJSONSync("config");
const leesCSVSync = require('./leesCSVSync.js');

const kilonet = leesCSVSync("kilonetnew");


module.exports = (station1, station2, negeerbareFeatures) => {
    const station1KleineLetters = station1.toLowerCase();
    const station2KleineLetters = station2.toLowerCase();

    const afstandEntry = kilonet.find((entry) => entry.includes(station1KleineLetters) && entry.includes(station2KleineLetters));
    if (!afstandEntry) return 0;
    const afstand = afstandEntry[3] - 0 + 0.01 * afstandEntry[4];

    const featureId = [station1KleineLetters, station2KleineLetters].sort().join("-");

    if (negeerbareFeatures.includes(featureId)) {
        if (!config.dubbele_features.includes(featureId)) return 0;
        if (negeerbareFeatures.filter((feature) => config.dubbele_features.includes(feature)).length > 2) return 0;
    }

    return afstand;
};