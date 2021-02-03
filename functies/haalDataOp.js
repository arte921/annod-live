const https = require('https');

const readJSONSync = require('./readJSONSync.js');
const config = readJSONSync("config");

let downloads = 0;

const main = (pad, json = true) => {
    // console.log("downloading " + pad);
    downloads++;
    if (downloads % 100 == 0) console.log("downloads: " + downloads);

    const options = {
        host: 'gateway.apiportal.ns.nl',
        path: pad,
        headers: {
            "Ocp-Apim-Subscription-Key": config.ns_app_key_primary
        }
    };

    let antwoord = '';

    return new Promise ((resolve, reject) => https.request(options, (response) => {
            if (response.statusCode == 200) {
                response.on('data', (deel) => antwoord += deel);
                response.on('end', () => resolve(json ? JSON.parse(antwoord) : antwoord));
            } else {
                return main(pad, json);
            }
        }).end()
    );
};

module.exports = main;