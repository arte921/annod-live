const programmaStartDatum = new Date();

const readJSON = require('./functies/readJSON.js');
const readJSONSync = require('./functies/readJSONSync.js');
const updateAlles = require('./functies/updateAlles.js');
const dowloadData = require('./functies/dowloadData.js');
const vindStation = require('./functies/vindStation.js');
const vindStationVanCode = require('./functies/vindStationVanCode.js');
const stationAfstand = require('./functies/stationAfstand.js');
const writeJSON = require('./functies/writeJSON.js');
const haalStationOp = require('./functies/haalStationOp.js');
const haalRitjesOp = require('./functies/haalReisOp.js');
const haalReisOp = require('./functies/haalReisOp.js');

const config = readJSONSync("config");

const startDatum = new Date(config.startmoment);
const eindDatum = new Date(startDatum.getTime() + config.speelduur_minuten * 60 * 1000);

console.log(startDatum, eindDatum);

let ritjesPromises = [];

let kandidaatRoutes = [];
let meesteAfstand = 0;

const berekenRitjes = async (aankomstTijd, station, negeerbareFeaturesReferentie, huidigeAfstand, routeTotNuToe, routeDeltas, nietVolgen) => {
    const vroegsteVertrektijd = new Date(aankomstTijd.getTime() + config.minimum_overstaptijd_seconden * 1000);
    // check of rit tot nu toe nog voldoet
    if (
        vroegsteVertrektijd > eindDatum
        || (
            routeTotNuToe.length > config.snelheidsmetingen_begin_ritjes &&
            huidigeAfstand / ((vroegsteVertrektijd - startDatum) / 3600000) < config.minimum_gemiddelde_snelheid
        ) || (
            routeDeltas.length > config.maximum_ritjes_stilstand &&
            routeDeltas.slice(- config.maximum_ritjes_stilstand - 1).reduce((a, b) => a + b) == 0
        )
    ) return;
    
    const laatsteVertrekTijd = new Date(aankomstTijd.getTime() + config.maximum_overstaptijd_seconden * 1000);
    let negeerbareFeatures = [...negeerbareFeaturesReferentie];
    
    kandidaatRoutes.push({
        afstand: huidigeAfstand,
        route: routeTotNuToe,
        eindtijd: aankomstTijd
    });

    if (huidigeAfstand > meesteAfstand) {
        meesteAfstand = huidigeAfstand;
        console.log(huidigeAfstand, aankomstTijd, routeTotNuToe);
        if (meesteAfstand >= config.minimale_update_afstand) {
            schrijfRoutes();
        }
    }

    let ritjes = await haalStationOp(station);

    let berekendeVertrekken = [];

    for (const rit of ritjes.departures) {
        if (rit.direction == nietVolgen) continue;
        if (!config.toegestane_treintypen.includes(rit.trainCategory)) continue;
        if (berekendeVertrekken.includes(rit.direction)) continue;
        berekendeVertrekken.push(rit.direction);
        const volledigeBestemming = vindStation(rit.direction);
        if (!volledigeBestemming) continue;

        const volledigeritRaw = await haalReisOp(station, volledigeBestemming.code, vroegsteVertrektijd.toISOString());
        // await dowloadData(`/reisinformatie-api/api/v3/trips?fromStation=${station}&toStation=${volledigeBestemming.code}&dateTime=${vroegsteVertrektijd.toISOString()}&yearCard=true&passing=true`, "trip");
        if (!volledigeritRaw.trips) return;

        let ritnummer = 0;

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

const schrijfRoutes = async () => {
    kandidaatRoutes.sort((a, b) => b.afstand - a.afstand);
    await writeJSON(kandidaatRoutes, 'resultaat');
}

process.on('SIGINT', () => schrijfRoutes().then(process.exit));

ritjesPromises.push(berekenRitjes(startDatum, config.start_station, [], 0, [{
        station: vindStationVanCode(config.start_station).namen.lang,
        aankomsttijd: startDatum.toISOString()
    }], [], ''));


(async () => {
    await Promise.all(ritjesPromises);
    // console.log(`${kandidaatRoutes.length} routes gevonden in ${(new Date() - programmaStartDatum) / 1000} seconden`);
    await schrijfRoutes();
})();