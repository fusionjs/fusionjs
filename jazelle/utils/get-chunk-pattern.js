const glob = require('globby');

async function getChunkPattern({root, patterns, jobs, index}) {
  const files = await glob(patterns, {
    cwd: root,
    gitignore: true,
    ignore: ['node_modules'],
  });
  const filesPerJob = Math.floor(files.length / jobs);
  const start = filesPerJob * index;
  return files
    .sort()
    .filter((f, i) => i % jobs === index)
    .map(str => '.*/' + str)
    .join('|');
}

module.exports = {getChunkPattern};