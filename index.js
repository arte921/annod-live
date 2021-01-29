const fs = require("fs");
const path = require("path");

const axios = require('axios');

const cwd = process.cwd();

const readJSON = async (path) => JSON.parse(
    await fs.promises.readFile(path)
);

const main = async () => {
    const config = await readJSON("config.json");

    const options = {
        method: 'post',
        url: 'https://gateway.apiportal.ns.nl/Spoorkaart-API/api/v1/spoorkaart',
        data: {
            'Ocp-Apim-Subscription-Key': config.ns_app_key_primary,
        }
    };


    const kaart = await axios(options).catch(console.log);

    console.log(kaart);
}

main();