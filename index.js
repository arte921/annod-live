const fs = require("fs");
const path = require("path");

const cwd = process.cwd();

const readJSON = async (path) => JSON.parse(
    await fs.promises.readFile(path)
);

const main = async () => {
    const config = await readJSON("config.json");
    console.log(config);
}

main();