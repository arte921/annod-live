const fs = require("fs");
const path = require("path");

const https = require('https');

const cwd = process.cwd();

const readJSON = async (path) => JSON.parse(
    await fs.promises.readFile(path)
);

const main = async () => {
    const config = await readJSON("config.json");

    

    const kaart = await haalKaartOp(config);

    console.log(kaart);
}

const haalKaartOp = (config) => {
    const options = {
        host: 'gateway.apiportal.ns.nl',
        path: '/Spoorkaart-API/api/v1/spoorkaart/',
        headers: {
            "Ocp-Apim-Subscription-Key": config.ns_app_key_primary
        }
    };

    let antwoord = '';

    return new Promise ((resolve, reject) => {
        https.request(options, (response) => {    
            response.on('data', (deel) => antwoord += deel);
    
            response.on('end', () => {
                resolve(antwoord);
            });
        }).end();
    })
}

main();