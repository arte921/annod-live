const leesIFFSync = require('./functies/leesIFFSync.js');
const readJSONSync = require('./functies/readJSONSync.js');

const config = readJSONSync("config");

const splitRegels = (tekst) => tekst.split(/\r?\n/);
const stripSpaties = (tekst) => tekst.replace(/ +$/, "");

const eindStation = (rit) => {
    const regels = splitRegels(rit);
    for (const regel of regels) {
        if (regel.charAt(0) == "<") {
            const regex = /[^ ]*/;
            return regex.exec(regel.substring(1)).toString();
        }
    }
}

// rekent eindstation standaard niet mee
// > beginstation
// . korte stop
// + lange stop
// < eindstation
const stopStations = (rit, stationstypen = [">", ".", "+"]) => splitRegels(rit)
    .filter((regel) => stationstypen.includes(regel.charAt(0)))
    .map((regel) => /[^ ]*/.exec(regel.substring(1)).toString());


const vertrekTijd = (rit, station) => {
    const regels = splitRegels(rit);
    for (const regel of regels) {
        const waarden = regel.slice(1).split(',');
        if (stripSpaties(waarden[0]) == station) {
            if ([">", "."].includes(regel.charAt(0))) {
                return waarden[1];
            } else if (regel.charAt(0) == "+") {
                return waarden[1];
            }
        }
    }
}

const tijdNaarMinutenGetal = (tijd) => (60 * tijd.substring(0, 2) - 0) + (tijd.substring(2, 4) - 0);

const dienstregeling = leesIFFSync('timetbls').split("#").map((entry) => "#" + entry).slice(1);

const stations = splitRegels(leesIFFSync('stations'))
    .slice(1)
    .map((regel) => regel.split(',').map(stripSpaties))
    .filter((kandidaat) => kandidaat[4] == "NL");

const haalStationNaamOp = (stationsCode) => stations.find((kandidaat) => stationsCode == kandidaat[1])[9];

const vertrekken = {};

for (const rit of dienstregeling) {
    const stops = stopStations(rit);
    for (const station of stations) {
        const stationsCode = station[1];

        if (stops.includes(stationsCode)) {
            if (!vertrekken[stationsCode]) vertrekken[stationsCode] = [];
            vertrekken[stationsCode].push({
                rit: rit,
                vertrektijd: vertrekTijd(rit, stationsCode)
            });
        }
    }
}

const haalVertrekkenOp = (station, tijd) => {
    for (const rit of vertrekken[station]) {

    }
}

// console.log(vertrekken['ah'][100]);
// console.log(vertrekTijd(dienstregeling[29676], 'op'));

// console.log(dienstregeling[29676]);
