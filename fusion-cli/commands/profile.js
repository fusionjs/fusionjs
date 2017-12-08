/* eslint-env node */
const path = require('path');
const fs = require('fs');
const profile = require('../lib/profiler');
const launchSourceMapExplorer = require('../launch-source-map-explorer.js');

exports.command = 'profile [--dir] [--environment] [--watch] [--file-count]';
exports.desc = 'Profile your application';
exports.builder = {
  // TODO(#18): support fusion profile --watch
  // 'skip-build': {
  //   type: 'boolean',
  //   default: false,
  //   describe: 'Use existing built assets',
  // },
  dir: {
    type: 'string',
    default: '.',
    describe: 'Root path for the application relative to CLI CWD',
  },
  environment: {
    type: 'string',
    default: 'production',
    describe: 'Either `production` or `development`',
  },
  watch: {
    type: 'boolean',
    default: false,
    describe: 'After profiling, launch source-map-explorer with file watch',
  },
  'file-count': {
    type: 'number',
    default: 20,
    describe:
      'The number of file sizes to output, sorted largest to smallest (-1 for all files)',
  },
};
exports.run = async function profileHandler({
  dir = '.',
  environment,
  fileCount,
  watch,
}) {
  const appBase = path.resolve(process.cwd(), dir);
  const genFileBase = path.join(appBase, '.fusion');
  const clientFileBase = path.join(genFileBase, `dist/${environment}/client`);
  const statsFile = path.join(genFileBase, 'stats.json');
  if (!fs.existsSync(statsFile)) {
    throw new Error(
      'Missing stats file - Please run a production build before profiling your application'
    );
  }

  const stats = require(statsFile);
  const clientEntry = stats.children.find(childStats => {
    return childStats.name === 'client';
  });

  if (!clientEntry) {
    throw new Error('Stats file missing client entry');
  }

  const {chunks} = clientEntry;
  const jsMapPairs = chunks.map(chunk => {
    const sourceFile = path.join(clientFileBase, chunk.files[0]);
    const mapFile = path.join(clientFileBase, chunk.files[1]);
    return {
      sourceFile,
      mapFile,
    };
  });

  profile({dir: dir, pairs: jsMapPairs, length: fileCount});
  if (watch) {
    launchSourceMapExplorer({dir: dir});
  }
};
