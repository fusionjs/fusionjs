const fs = require('fs');
const util = require('util');
const path = require('path');

const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const exists = util.promisify(fs.exists);

module.exports = {
  async onBuildEnd(stats) {
    const statsFile = path.resolve(__dirname, 'stats-output.json');
    const previousStats = await readStats(statsFile);
    await writeFile(statsFile, JSON.stringify([...previousStats, stats]));
  }
};

async function readStats(file) {
  if (await exists(file)) {
    return JSON.parse(await readFile(file, 'utf-8'));
  } else {
    return [];
  }
}
