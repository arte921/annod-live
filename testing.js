
const leesCSV = require('./functies/leesCSV.js');
const haalStationNaamOp = require('./functies/haalStationNaamOp.js');
const leesCSVSync = require('./functies/leesCSVSync.js');

(async () => {
    console.log(haalStationNaamOp("ah"));
    // console.log(leesCSVSync("stations"));
    // const dienstregeling = await leesCSV("ff_timetbls_spiekbest");
    // console.log(dienstregeling.map((entry) => [entry[1]]));
})();