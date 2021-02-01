const readJSON = require('./code/readJSON.js');
const readJSONSync = require('./code/readJSONSync.js');
const updateAlles = require('./code/updateAlles.js');
const legAfstand = require('./code/legAfstand.js');

const stations = readJSONSync("stations").payload;
const config = readJSONSync("config");

const main = async () => {

    // await dowloadData("/reisinformatie-api/api/v3/trips?fromStation=OP&viaStation=AH&toStation=NKK&passing=true", "temp")
    const route = await readJSON("temp");

    route.trips[0].legs.forEach((leg) => {
        console.log(legAfstand(leg));
        console.log("Get out on the " + leg.destination.exitSide + " side of the train.\n");
    });

    return;
    await updateAlles();
};

main();