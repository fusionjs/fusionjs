const {getChunkPattern} = require('../utils/get-chunk-pattern');

async function chunk({root, patterns, jobs, index}) {
  // don't console.log to avoid automatic linefeed insertion
  process.stdout.write(getChunkPattern({root, patterns: patterns.split('|'), jobs, index}));
}

module.exports = {chunk};