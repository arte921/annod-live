const leesCSVSync = require('./leesCSVSync.js');

const stations = leesCSVSync("stations");
// console.log(stations);

stations.forEach(console.log);

module.exports = (code) => stations[0].find((kandidaat) => kandidaat[0].replace(" ", "") == code)[8];