const leesIFFSync = require('./functies/leesIFFSync.js');
const readJSONSync = require('./functies/readJSONSync.js');

const config = readJSONSync("config");

const splitRegels = (tekst) => tekst.split(/\r?\n/);
const stripSpaties = (tekst) => tekst.replace(/ +$/, "");
const splitEntries = (tekst) => tekst.split(',').map(stripSpaties);
const tijdNaarMinutenGetal = (tijd) => (60 * tijd.substring(0, 2) - 0) + (tijd.substring(2, 4) - 0);
const getalBeginNullen = (getal, totaleLengte = 2) => ("0".repeat(totaleLengte) + getal).slice(-totaleLengte);
const minutenGetalNaarTijd = (minuten) => getalBeginNullen(Math.floor(minuten / 60)) + getalBeginNullen(minuten % 60);

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
const stopStations = (rit, stoptypen = [">", ".", "+"]) => splitRegels(rit)
    .filter((regel) => stoptypen.includes(regel.charAt(0)))
    .map((regel) => /[^ ]*/.exec(regel.substring(1)).toString());

const ritVanafStation = (rit, station) => {
    const stations = splitRegels(rit)
        .filter((regel) => [".", "+", "<"].includes(regel.charAt(0)))
        .map((regel) => splitEntries(regel.substring(1)));

    return stations.slice(stations.map((stop) => stop[0]).indexOf(station) + 1)
        .map((data) => ({
            station: data[0],
            aankomsttijd: tijdNaarMinutenGetal(data[1])
        }));
}

const vertrekTijd = (rit, station) => {
    const regels = splitRegels(rit);
    for (const regel of regels) {
        const waarden = regel.slice(1).split(',');
        if (stripSpaties(waarden[0]) == station) {
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
// console.log(dienstregeling[0]);

const rijdtOpDag = (rit, dag) => voetnoten[
        splitRegels(rit)
            .find((regel) => regel.charAt(0) == "-")
            .slice(1)
            .split(',')
            .map(stripSpaties)[0] - 0
    ].charAt(dag) == "1";


// console.log(dienstregeling[29676]);
// console.log(rijdtOpDag(dienstregeling[29676], config.dag));

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
                vertrektijd: tijdNaarMinutenGetal(vertrekTijd(rit, stationsCode))
            });
        }
    }
}

const stationVertrekkenMoment = (station, minimumTijdMinuten, maximumTijdMinuten) => {
    let resultaat = [];
    for (const [key, vertrek] of vertrekken[station].entries()) {
        const vertrekTijdMinuten = vertrek.vertrektijd;
        if (vertrekTijdMinuten >= minimumTijdMinuten && vertrekTijdMinuten <= maximumTijdMinuten && rijdtOpDag(vertrek.rit, config.dag)) {
            resultaat.push(vertrek);
        };
    }
    return resultaat;
}



console.log(ritVanafStation(dienstregeling[29676], 'op'));
console.log(stationVertrekkenMoment('op', startTijdMinuten, startTijdMinuten + config.maximum_overstaptijd_seconden / 60));
// console.log(dienstregeling[29676]);

let kandidaatRoutes = [];
let meesteAfstand = 0;


const berekenRitjes = (aankomstTijdMinuten, station, negeerbareFeaturesReferentie, huidigeAfstand, routeTotNuToe, routeDeltas, nietVolgen) => {
    const vroegsteVertrektijd = aankomstTijdMinuten + config.minimum_overstaptijd_seconden / 60;

    // check of rit tot nu toe nog voldoet
    if (
        vroegsteVertrektijd > eindTijdMinuten
        || (
            routeTotNuToe.length > config.snelheidsmetingen_begin_ritjes &&
            huidigeAfstand / ((vroegsteVertrektijd - startTijdMinuten) / 60) < config.minimum_gemiddelde_snelheid
        ) || (
            routeDeltas.length > config.maximum_ritjes_stilstand &&
            routeDeltas.slice(- config.maximum_ritjes_stilstand - 1).reduce((a, b) => a + b) == 0
        )
    ) return;
    
    const laatsteVertrekTijd = aankomstTijdMinuten + config.maximum_overstaptijd_seconden / 60;
    let negeerbareFeatures = [...negeerbareFeaturesReferentie];
    
    kandidaatRoutes.push({
        afstand: huidigeAfstand,
        route: routeTotNuToe,
        eindtijd: aankomstTijd
    });

    if (huidigeAfstand > meesteAfstand) {
        meesteAfstand = huidigeAfstand;
        console.log(huidigeAfstand, aankomstTijdMinuten, routeTotNuToe);
        if (meesteAfstand >= config.minimale_update_afstand) {
            schrijfRoutes();
        }
    }

    let ritjes = vertrekken[station];

    let berekendeVertrekken = [];

    

    for (const rit of ritjes) {
        if (eindStation(rit) == nietVolgen) continue;
        if (!config.toegestane_treintypen.includes(rit.trainCategory)) continue;
        if (berekendeVertrekken.includes(rit.direction)) continue;
        berekendeVertrekken.push(rit.direction);
        const volledigeBestemming = vindStation(rit.direction);
        if (!volledigeBestemming) continue;

        const volledigeritRaw = await haalReisOp(station, volledigeBestemming.code, vroegsteVertrektijd.toISOString());
        if (!volledigeritRaw.trips) return;

        let vertrekTijd = new Date(volledigeritRaw.trips[0].legs[0].origin.plannedDateTime);
        for (const vertrekKandidaat of volledigeritRaw.trips) {
            vertrekTijd = new Date(volledigeritRaw.trips[0].legs[0].origin.plannedDateTime);
            if (vertrekTijd > laatsteVertrekTijd) return;
            if (vertrekTijd < vroegsteVertrektijd) continue;
        }
        
        if (vertrekTijd < vroegsteVertrektijd) continue;

        routeTotNuToe[routeTotNuToe.length - 1].vertrektijd = vertrekTijd.toISOString();
        routeTotNuToe[routeTotNuToe.length - 1].overstaptijd_seconden = (vertrekTijd - aankomstTijd) / 1000;

        let vorigeStationCode = "";
        let afstand = huidigeAfstand;

        let ritjesWachtrij = [];

        for (const leg of volledigeritRaw.trips[0].legs) {
            if (leg.origin.plannedDateTime > laatsteVertrekTijd) return;
            for (const [index, station] of leg.stops.entries()) {
                const huidigStation = vindStation(station.name);
                if (!huidigStation) continue;

                if (index == 0) {
                    vorigeStationCode = huidigStation.code;
                    continue;
                }
                
                if (huidigStation.land != "NL") continue;    //  TODO: meer landen
                
                afstand += stationAfstand(vorigeStationCode, huidigStation.code, negeerbareFeatures);

                // er wordt op het station gestopt
                if (!station.passing) {
                    ritjesWachtrij.push([
                        new Date(station.plannedArrivalDateTime),
                        huidigStation.code,
                        negeerbareFeatures,
                        afstand,
                        [...routeTotNuToe, {
                            station: huidigStation.namen.lang,
                            aankomsttijd: new Date(station.plannedArrivalDateTime).toISOString()
                        }],
                        [...routeDeltas, afstand - huidigeAfstand],
                        rit.direction
                    ]);
                }

                vorigeStationCode = huidigStation.code;
            }
        }
        ritjesWachtrij.reverse().forEach((taak) => ritjesPromises.push(berekenRitjes(...taak)));
    }
};