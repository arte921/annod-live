const leesIFFSync = require('./functies/leesIFFSync.js');

const dienstregelingRaw = leesIFFSync('timetbls');

const dienstregeling = dienstregelingRaw.split("#").map((entry) => "#" + entry).slice(1);

module.exports = 