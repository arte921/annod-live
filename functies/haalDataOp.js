const https = require('https');

const readJSONSync = require('./readJSONSync.js');
const config = readJSONSync("config");

const main = (pad, json = true) => {

    const options = {
        host: 'gateway.apiportal.ns.nl',
        path: pad,
        headers: {
            "Ocp-Apim-Subscription-Key": config.ns_app_key_primary
        }
    };

    let antwoord = '';
    return new Promise ((resolve, reject) => {
            const request = https.request(options, (response) => {
                response.on('data', (deel) => antwoord += deel);
                response.on('end', () => resolve(json ? JSON.parse(antwoord) : antwoord));
            });
            request.end();
            request.on('error', () => resolve({statusCode: 429}));
        }
    );
};

module.exports = main;