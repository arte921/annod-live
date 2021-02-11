const leesIFFSync = require('./functies/leesIFFSync.js');
const readJSONSync = require('./functies/readJSONSync.js');
const stationAfstand = require('./functies/stationAfstand.js');
const stationAfstandKilonet = require('./functies/stationAfstandKilonet.js');

const config = readJSONSync("config");

const splitRegels = (tekst) => tekst.split(/\r?\n/);
const stripSpaties = (tekst) => tekst.replace(/ +$/, "");
const splitEntries = (tekst) => tekst.split(',').map(stripSpaties);
const tijdNaarMinutenGetal = (tijd) => (60 * (tijd.substring(0, 2) - 0)) + (tijd.substring(2, 4) - 0);
const getalBeginNullen = (getal, totaleLengte = 2) => ("0".repeat(totaleLengte) + getal).slice(-totaleLengte);
const minutenGetalNaarTijd = (minuten) => getalBeginNullen(Math.floor(minuten / 60)) + getalBeginNullen(minuten % 60);

const haalEnkeleRegelOp = (rit, sleutel) => splitEntries(splitRegels(rit)
    .find((regel) => regel.charAt(0) == sleutel).substring(1));

// rekent eindstation standaard niet mee
// > beginstation
// . korte stop
// + lange stop
// < eindstation
const stopStations = (rit, stoptypen = [">", ".", "+"]) => splitRegels(rit)
    .filter((regel) => stoptypen.includes(regel.charAt(0)))
    .map((regel) => /[^ ]*/.exec(regel.substring(1)).toString());

const ritStationsVolledig = (rit, stoptypen = [">", ".", "+", "<"]) => splitRegels(rit)
    .filter((regel) => [">", ";", ".", "+", "<"].includes(regel.charAt(0)))
    .map((regel) => {
        const type = regel.charAt(0);
        const entries = splitEntries(regel.substring(1));
        const stopt = type != ";";
        const vertrekIndex = type == "+" ? 2 : 1;
        return {
            stopt: stopt,
            vertrektijd: stopt ? tijdNaarMinutenGetal(entries[vertrekIndex]) : null,
            aankomsttijd: stopt ? tijdNaarMinutenGetal(entries[1]) : null,
            station: entries[0]
        }
    });


const ritVanafStation = (rit, station) => {
    const volledigeRit = ritStationsVolledig(rit);
    const vertrekIndex = volledigeRit.map((station) => station.station).indexOf(station);
    return volledigeRit.slice(vertrekIndex);
}

const vertrekTijd = (rit, station) => {
    const regels = splitRegels(rit);
    for (const regel of regels) {
        const waarden = splitEntries(regel.slice(1));
        if (waarden[0] == station) {
            if ([">", "."].includes(regel.charAt(0))) {
                return waarden[1];
            } else if (regel.charAt(0) == "+") {
                return waarden[2];
            }
        }
    }
}

const startTijdMinuten = tijdNaarMinutenGetal(config.starttijd);
const eindTijdMinuten = startTijdMinuten + config.speelduur_minuten;

const dienstregeling = leesIFFSync('timetbls').split("#").map((entry) => "#" + entry).slice(1);
const voetnoten = leesIFFSync('footnote').split("#").slice(1).map((entry) => splitRegels(entry)[1]);

const rijdtOpDag = (rit, dag) => {
    const index = splitRegels(rit)
        .find((regel) => regel.charAt(0) == "-")
        .slice(1)
        .split(',')
        .map(stripSpaties)[0] - 0
    if (index >= voetnoten.length) return false;
    return voetnoten[index].charAt(dag) == "1";
}

// console.log(dienstregeling[29676]);
// console.log(rijdtOpDag(dienstregeling[29676], config.dag));

const stations = splitRegels(leesIFFSync('stations'))
    .slice(1)
    .map(splitEntries)
    .filter((kandidaat) => kandidaat[4] == "NL");

const stationsNaam = (stationsCode) => stations.find((kandidaat) => stationsCode == kandidaat[1])[9];

const vertrekken = {};

for (const rit of dienstregeling) {
    const stops = stopStations(rit);
    for (const station of stations) {
        const stationsCode = station[1];

        if (stops.includes(stationsCode)) {
            if (!vertrekken[stationsCode]) vertrekken[stationsCode] = [];
            vertrekken[stationsCode].push({
                rit: rit,
                vertrektijd: tijdNaarMinutenGetal(vertrekTijd(rit, stationsCode))
            });
        }
    }
}

const stationVertrekkenMoment = (station, minimumTijdMinuten, maximumTijdMinuten) => {
    let resultaat = [];
    for (const [_, vertrek] of vertrekken[station].entries()) {
        const vertrekTijdMinuten = vertrek.vertrektijd;
        if (vertrekTijdMinuten >= minimumTijdMinuten && vertrekTijdMinuten <= maximumTijdMinuten && rijdtOpDag(vertrek.rit, config.dag)) {
            resultaat.push(vertrek.rit);
        };
    }
    return resultaat;
}

// console.log(ritVanafStation(dienstregeling[29676], 'op'));
// console.log(stationVertrekkenMoment('op', startTijdMinuten, startTijdMinuten + config.maximum_overstaptijd_seconden / 60));
// console.log(dienstregeling[29676]);
// console.log(haalEnkeleRegelOp(dienstregeling[29676], "&"));

let kandidaatRoutes = [];
let meesteAfstand = 0;

const berekenRitjes = (aankomstTijdMinuten, station, negeerbareFeaturesReferentie, huidigeAfstand, routeTotNuToe, routeDeltas, nietVolgen) => {
    // console.log(aankomstTijdMinuten, station, negeerbareFeaturesReferentie, huidigeAfstand, routeTotNuToe, routeDeltas, nietVolgen);
    const vroegsteVertrektijd = aankomstTijdMinuten + config.minimum_overstaptijd_seconden / 60;

    // check of rit tot nu toe nog voldoet
    if (
        vroegsteVertrektijd > eindTijdMinuten
        || (
            routeDeltas.length > config.snelheidsmetingen_begin_ritjes &&
            huidigeAfstand / ((aankomstTijdMinuten - startTijdMinuten) / 60) < config.minimum_gemiddelde_snelheid
        ) || (
            routeDeltas.length > config.maximum_ritjes_stilstand &&
            routeDeltas.slice(- config.maximum_ritjes_stilstand - 1).reduce((a, b) => a + b) == 0
        ) || !vertrekken[station]
    ) return;

    const laatsteVertrekTijd = aankomstTijdMinuten + config.maximum_overstaptijd_seconden / 60;
    let negeerbareFeatures = [...negeerbareFeaturesReferentie];

    if (huidigeAfstand > meesteAfstand) {
        meesteAfstand = huidigeAfstand;
        const routeString = routeTotNuToe.map((deel, index) => [
            minutenGetalNaarTijd,
            stationsNaam,
            minutenGetalNaarTijd
        ][index % 3](deel)).join("\n");
        
        console.log(huidigeAfstand, routeString);

        if (meesteAfstand >= config.minimale_update_afstand) {
            kandidaatRoutes.push({
                afstand: huidigeAfstand,
                route: routeString
            });
            schrijfRoutes();
        }
    }

    // sort?
    let ritjes = stationVertrekkenMoment(station, vroegsteVertrektijd, laatsteVertrekTijd);
    let berekendeVertrekken = [];

    for (const rit of ritjes) {
        if (!config.toegestane_treintypen.includes(haalEnkeleRegelOp(rit, "&")[0])) continue;
        const richting = haalEnkeleRegelOp(rit, "<")[0];
        if (richting == nietVolgen) continue;
        if (berekendeVertrekken.includes(richting)) continue;
        berekendeVertrekken.push(richting);

        let afstand = huidigeAfstand;
        
        const verdereRit = ritVanafStation(rit, station);
        const vertrekTijd = verdereRit[0].vertrektijd;
        // console.log(verdereRit);

        let vorigeStation = station;
        for (const vertrek of verdereRit.slice(1)) {
            afstand += stationAfstand(vorigeStation, vertrek.station, negeerbareFeatures);

            // er wordt op het station gestopt
            if (vertrek.stopt) {
                berekenRitjes(
                    vertrek.aankomsttijd,
                    vertrek.station,
                    negeerbareFeatures,
                    afstand,
                    [...routeTotNuToe, vertrekTijd, vertrek.aankomsttijd, vertrek.station],
                    [...routeDeltas, afstand - huidigeAfstand],
                    richting
                );
            }

            vorigeStation = vertrek.station;
        }
    }
};

const schrijfRoutes = async () => {
    kandidaatRoutes.sort((a, b) => b.afstand - a.afstand);
    await writeJSON(kandidaatRoutes, 'resultaat');
}

console.log("begin");

berekenRitjes(
    startTijdMinuten,
    config.start_station,
    [],
    0,
    [startTijdMinuten, config.start_station],
    [],
    ''
);