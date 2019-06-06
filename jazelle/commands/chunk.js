// @flow
const {getChunkPattern} = require('../utils/get-chunk-pattern');

/*::
export type ChunkArgs = {
  root: string,
  patterns: string,
  jobs: string,
  index: string,
};
export type Chunk = (ChunkArgs) => Promise<void>;
*/
const chunk /*: Chunk */ = async ({root, patterns, jobs, index}) => {
  // don't console.log to avoid automatic linefeed insertion
  process.stdout.write(
    await getChunkPattern({
      root,
      patterns: patterns.split('|'),
      jobs: parseInt(jobs, 10),
      index: parseInt(index, 10),
    })
  );
};

module.exports = {chunk};
