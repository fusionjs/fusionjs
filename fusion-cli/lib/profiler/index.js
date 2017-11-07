/* eslint-env node */
/* eslint-disable no-console */
const {
  loadSourceMap,
  computeGeneratedFileSizes,
} = require('source-map-explorer');
const analyzeIndividuals = require('./individual.js');

module.exports = function profile({pairs, length}) {
  console.log('---------------------------');
  console.log('Profiling Your Application');
  console.log('---------------------------\n');
  const mergedSizes = pairs.map(loadSizes).reduce((merged, sizes) => {
    return Object.assign(merged, sizes);
  }, {});

  // TODO(#22): At some point we had built out dependency trees here
  // and figured out the largest `node_modules` as well as individual files, both nested top level,
  // but it broke when we upgraded webpack
  // for now, we just identify the largest X files
  analyzeIndividuals(mergedSizes, length);
};

function loadSizes(opts /*: FilePair*/) {
  const {sourceFile, mapFile} = opts;
  const data = loadSourceMap(sourceFile, mapFile);
  if (!data) {
    // Library handles correct error logging
    process.exit(1);
  }
  const {mapConsumer, jsData} = data;
  const sizes = computeGeneratedFileSizes(mapConsumer, jsData);
  return Object.keys(sizes)
    .filter(file => file.match(/\.jsx?$/))
    .reduce((rtn, file) => {
      return Object.assign({}, rtn, {
        [file]: {
          size: sizes[file],
          // This doesn't actually work because of tree shaking
          // gzipSize: gzipSize.sync(fs.readFileSync(file, 'utf-8')),
        },
      });
    }, {});
}
