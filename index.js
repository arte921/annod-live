const fs = require("fs");
const path = require("path");

const https = require('https');

const cwd = process.cwd();

const readJSON = async (locatie) => JSON.parse(
    await fs.promises.readFile(path.join("opslag", locatie + ".json"))
);

const readJSONSync = (locatie) => JSON.parse(
    fs.readFileSync(path.join("opslag", locatie + ".json"))
);

const stations = readJSONSync("stations").payload;
const spoorkaart = readJSONSync("spoorkaart").payload.features;
const config = readJSONSync("config");

const main = async () => {

    // await dowloadData("/reisinformatie-api/api/v3/trips?fromStation=OP&viaStation=AH&toStation=NKK&passing=true", "temp")
    const route = await readJSON("temp");

    let afstand = 0;
    route.trips[0].legs.forEach((leg) => {
        let vorigStation = "";
        leg.stops.forEach((station, index) => {
            const volledigStation = stations.find((kandidaatStation) => kandidaatStation.namen.lang == station.name);
            

            if (index != 0) {
                afstand += stationAfstand(vorigStation, volledigStation.code);
            }

            console.log(volledigStation.code);

            vorigStation = volledigStation.code;
        });

        console.log(afstand);
        console.log("Get out on the " + leg.destination.exitSide + " side of the train.\n");
    });

    return;
    await updateAlles();
};

const stationAfstand = (station1, station2) => {
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

const updateAlles = async () => {
    dowloadData('/Spoorkaart-API/api/v1/spoorkaart/', config.kaart_locatie);
    dowloadData('/reisinformatie-api/api/v2/stations', config.stations_locatie);
    dowloadData('/reisinformatie-api/api/v2/arrivals?maxJourneys=1000&station=UT', config.aankomsten_locatie);
    dowloadData('/reisinformatie-api/api/v2/departures?maxJourneys=1000&station=UT', config.vertrekken_locatie);
};

const dowloadData = async (pad, locatie) => {
    const data = await haalDataOp(config.ns_app_key_primary, pad);
    await fs.promises.writeFile(path.join("opslag", locatie + ".json"), data);
};

const haalDataOp = (pad) => {
    const options = {
        host: 'gateway.apiportal.ns.nl',
        path: pad,
        headers: {
            "Ocp-Apim-Subscription-Key": config.ns_app_key_primary
        }
    };

    let antwoord = '';

    return new Promise ((resolve, reject) => https.request(options, (response) => {
            response.on('data', (deel) => antwoord += deel);
            response.on('end', () => resolve(antwoord));
        }).end()
    );
};

const coordinaatAfstand = (coordinaat1, coordinaat2) => {
    const radialenfactor = Math.PI / 180;

    const lat1 = coordinaat1[1] * radialenfactor;
    const lon1 = coordinaat1[0] * radialenfactor;
    const lat2 = coordinaat2[1] * radialenfactor;
    const lon2 = coordinaat2[0] * radialenfactor;

    const dlat = lat1 - lat2;
    const dlon = lon1 - lon2;
    
    const a = Math.pow(Math.sin(dlat / 2), 2) +
        Math.cos(lat1) *
        Math.cos(lat2) *
        Math.pow(Math.sin(dlon / 2), 2);
    
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

main();