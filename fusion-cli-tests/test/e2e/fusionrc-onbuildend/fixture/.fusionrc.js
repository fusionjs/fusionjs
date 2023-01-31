const fs = require('fs');
const path = require('path');

module.exports = {
  async onBuildEnd(stats) {
    const statsFile = path.resolve(__dirname, 'stats-output.json');
    const previousStats = readStats(statsFile);
    fs.writeFileSync(statsFile, JSON.stringify([...previousStats, stats]));
  }
};

function readStats(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (e) {
    return [];
  }
}
