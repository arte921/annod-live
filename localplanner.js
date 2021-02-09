const leesIFFSync = require('./functies/leesIFFSync.js');
const haalStationNaamOp = require('./functies/haalStationNaamOp.js');

const splitRegels = (tekst) => tekst.split(/\r?\n/);

const eindStation = (rit) => {
    const regels = splitRegels(rit);
    for (const regel of regels) {
        if (regel.charAt(0) == "<") {
            const regex = /[^ ]*/;
            return regex.exec(regel.substring(1)).toString();
        }
    }
}

const stopStations = (rit) => {
    let resultaat = [];
    const regels = splitRegels(rit);
    for (const regel of regels) {
        // begin, korte stop, lange stop, eind
        if ([">", ".", "+", "<"].includes(regel.charAt(0))) {
            const regex = /[^ ]*/;
            resultaat.push(regex.exec(regel.substring(1)).toString());
        }
    }
    return resultaat;
}

const dienstregeling = leesIFFSync('timetbls').split("#").map((entry) => "#" + entry).slice(1);
const stations = splitRegels(leesIFFSync('stations'))
    .slice(1)
    .map((regel) => regel.split(',').map((waarde) => waarde.replace(/ +$/, "")))
    // .filter((kandidaat) => kandidaat[4] == "NL");

// console.log(stations.length);

// console.log(dienstregeling[29676]);

const vertrekken = {};

for (const station of stations) {

}



// console.log(eindStation(dienstregeling[29676]));