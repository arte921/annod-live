const programmaStartDatum = new Date();

const readJSON = require('./functies/readJSON.js');
const readJSONSync = require('./functies/readJSONSync.js');
const updateAlles = require('./functies/updateAlles.js');
const legAfstand = require('./functies/legAfstand.js');
const dowloadData = require('./functies/dowloadData.js');
const haalDataOp = require('./functies/haalDataOp.js');
const vindStation = require('./functies/vindStation.js');
const stationAfstand = require('./functies/stationAfstand.js');
const writeJSONSync = require('./functies/writeJSONSync.js');
const haalStationOp = require('./functies/haalStationOp.js');

const config = readJSONSync("config");

const startDatum = new Date(config.startmoment);
const eindDatum = new Date(startDatum.getTime() + config.speelduur_minuten * 60 * 1000);

let kandidaatRoutes = [];
let meesteAfstand = 0;

const berekenRitjes = async (aankomstTijd, station, negeerbareFeaturesReferentie, huidigeAfstand, routeTotNuToe) => {
    const vroegsteVertrektijd = new Date(aankomstTijd.getTime() + config.minimum_overstaptijd_seconden * 1000);

    // check of rit tot nu toe nog voldoet
    if (vroegsteVertrektijd > eindDatum ||
        (routeTotNuToe.length >= config.snelheidsmetingen_begin_ritjes &&
            huidigeAfstand / (vroegsteVertrektijd - startDatum) / 3600000 < config.minimum_gemiddelde_snelheid)) return;
    

    let negeerbareFeatures = [...negeerbareFeaturesReferentie];
    
    kandidaatRoutes.push({
        afstand: huidigeAfstand,
        route: routeTotNuToe,
        eindtijd: aankomstTijd
    });

    if (huidigeAfstand > meesteAfstand) {
        meesteAfstand = huidigeAfstand;
        console.log(huidigeAfstand, routeTotNuToe);
    }

    let ritjes = await haalStationOp(station);

    let berekendeVertrekken = [];

    const gefilterdeRitjes = ritjes.departures.filter((rit) => config.toegestane_treintypen.includes(rit.trainCategory));

    for (const rit of gefilterdeRitjes) {
        if (berekendeVertrekken.includes(rit.direction)) continue;
        berekendeVertrekken.push(rit.direction);
        const volledigeBestemming = vindStation(rit.direction);
        const volledigeritRaw = await dowloadData(`/reisinformatie-api/api/v3/trips?fromStation=${station}&toStation=${volledigeBestemming.code}&dateTime=${vroegsteVertrektijd.toISOString()}&yearCard=true&passing=true`, 'tempritje');
        if (!volledigeritRaw.trips) console.log("============= GEEN VOLLEDIGE RIT VOOR =============", rit.direction, volledigeritRaw);
        if (volledigeritRaw.trips[0].legs.length > 1) {
            // console.log("===========MORE THAN ONE LEG=============", volledigeritRaw.trips[0].legs.length);
            continue;
        }
        const volledigeRitLeg = volledigeritRaw.trips[0].legs[0];

        let vorigeStationCode = "";
        let afstand = huidigeAfstand;

        for (const [index, station] of volledigeRitLeg.stops.entries()) {
            const huidigStation = vindStation(station.name);
            if (!huidigStation) continue;

            if (index == 0) {
                vorigeStationCode = huidigStation.code;
                continue;
            }
            
            if (huidigStation.land == "D") return;
            
            afstand += stationAfstand(vorigeStationCode, huidigStation.code, negeerbareFeatures);

            // er wordt op het station gestopt
            if (!station.passing) {
                await berekenRitjes(new Date(station.plannedArrivalDateTime), huidigStation.code, negeerbareFeatures, afstand, [...routeTotNuToe, station.name]);
            }

            vorigeStationCode = huidigStation.code;
        }
    }
};

(async () => {
    await berekenRitjes(startDatum, config.start_station, [], 0, []);
    console.log(`${kandidaatRoutes.length} routes gevonden in ${(new Date() - programmaStartDatum) / 1000} seconden`);
    kandidaatRoutes.sort((a, b) => b.afstand - a.afstand);
    writeJSONSync(kandidaatRoutes, 'resultaat');
})();
