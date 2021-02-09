
const stationAfstand = require('./functies/stationAfstand.js');

(async () => {
    const kilonet = await leesCSV("kilonetnew");
    const station1 = "ah";
    const station2 = "ahz";
    const afstandEntry = kilonet.find((entry) => entry.includes(station1) && entry.includes(station2));
    const afstand = afstand[3] - 0 + 0.01 * afstand[4];
})();