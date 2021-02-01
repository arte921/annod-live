const stationAfstand = require('./code/stationAfstand.js');
const readJSON = require('./code/readJSON.js');
const readJSONSync = require('./code/readJSONSync.js');
const haalDataOp = require('./code/haalDataOp.js');
const dowloadData = require('./code/dowloadData.js');
const updateAlles = require('./code/updateAlles.js');

const stations = readJSONSync("stations").payload;
const config = readJSONSync("config");

const main = async () => {

    // await dowloadData("/reisinformatie-api/api/v3/trips?fromStation=OP&viaStation=AH&toStation=NKK&passing=true", "temp")
    const route = await readJSON("temp");

    route.trips[0].legs.forEach((leg) => {
        let vorigStation = "";
        let afstand = 0;
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

main();