const readJSONSync = require('./readJSONSync.js');
const coordinaatAfstand = require('./coordinaatAfstand.js');
const spoorkaart = readJSONSync("spoorkaart").payload.features;
const config = readJSONSync("config");

module.exports = (station1, station2, negeerbareFeatures) => {
    const station1KleineLetters = station1.toLowerCase();
    const station2KleineLetters = station2.toLowerCase();

    const feature = spoorkaart.find((feature) => {
        return feature.properties.from == station1KleineLetters && feature.properties.to == station2KleineLetters ||
        feature.properties.from == station2KleineLetters && feature.properties.to == station1KleineLetters
    });

    if (!feature) return 0;

    const featureId = feature.properties.from + feature.properties.to;

    if (negeerbareFeatures.includes(featureId)) {
        if (!config.dubbele_features.includes(featureId)) return 0;
        if (negeerbareFeatures.filter((feature) => config.dubbele_features.includes(feature)).length > 2) return 0;
    }

    negeerbareFeatures.push(featureId);

    let afstand = 0;
    feature.geometry.coordinates.forEach((coordinaat, index) => {
        if (index > 1) afstand += coordinaatAfstand(coordinaat, feature.geometry.coordinates[index - 1])
    });

    if (afstand == 0) console.log(station1KleineLetters, station2KleineLetters);

    return afstand;
};