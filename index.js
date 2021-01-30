const fs = require("fs");
const path = require("path");

const https = require('https');

const cwd = process.cwd();

const readJSON = async (path) => JSON.parse(
    await fs.promises.readFile(path)
);

const main = async () => {
    const config = await readJSON("config.json");


    console.log(afstand(
        [
            5.89916658401489,
            51.9850006103516
        ],
        [
            4.90027761459351,
            52.3788871765137
        ]
    ));

    

    // await updateAlles(config);
    
    const kaart = fs.promises.readFile(config.kaart_locatie);
    const stations = fs.promises.readFile(config.stations_locatie);
    const aankomsten = fs.promises.readFile(config.aankomsten_locatie);
    const vertrekken = fs.promises.readFile(config.vertrekken_locatie);
}

const updateAlles = async (config) => {
    dowloadData('/Spoorkaart-API/api/v1/spoorkaart/', config.kaart_locatie, config.ns_app_key_primary);
    dowloadData('/reisinformatie-api/api/v2/stations', config.stations_locatie, config.ns_app_key_primary);
    dowloadData('/reisinformatie-api/api/v2/arrivals?maxJourneys=1000&station=UT', config.aankomsten_locatie, config.ns_app_key_primary);
    dowloadData('/reisinformatie-api/api/v2/departures?maxJourneys=1000&station=UT', config.vertrekken_locatie, config.ns_app_key_primary);
}

const dowloadData = async (pad, locatie, ns_app_key_primary) => {
    const data = await haalDataOp(ns_app_key_primary, pad);
    await fs.promises.writeFile(locatie, data);
}

const haalDataOp = (ns_app_key_primary, pad) => {
    const options = {
        host: 'gateway.apiportal.ns.nl',
        path: pad,
        headers: {
            "Ocp-Apim-Subscription-Key": ns_app_key_primary
        }
    };

    let antwoord = '';

    return new Promise ((resolve, reject) => https.request(options, (response) => {
            response.on('data', (deel) => antwoord += deel);
            response.on('end', () => resolve(antwoord));
        }).end()
    );
}

const afstand = (coordinaat1, coordinaat2) => {
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
}

main();