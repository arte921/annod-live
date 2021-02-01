const readJSONSync = require('./readJSONSync.js');
const spoorkaart = readJSONSync("spoorkaart").payload.features;
const coordinaatAfstand = require('./coordinaatAfstand.js');

module.exports = (station1, station2) => {
    const station1KleineLetters = station1.toLowerCase();
    const station2KleineLetters = station2.toLowerCase();

    const feature = spoorkaart.find((feature) => {
        return feature.properties.from == station1KleineLetters && feature.properties.to == station2KleineLetters ||
        feature.properties.from == station2KleineLetters && feature.properties.to == station1KleineLetters
    }
    );

    let afstand = 0;
    feature.geometry.coordinates.forEach((coordinaat, index) => {
        if (index > 1) afstand += coordinaatAfstand(coordinaat, feature.geometry.coordinates[index - 1])
    });

    return afstand;
};