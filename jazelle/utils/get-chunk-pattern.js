// @flow
const glob = require('globby');

/*::
export type GetChunkPatternArgs = {
  root: string,
  patterns: Array<string>,
  jobs: number,
  index: number,
};
export type GetChunkPattern = (GetChunkPatternArgs) => Promise<string>;
*/
const getChunkPattern /*: GetChunkPattern */ = async ({
  root,
  patterns,
  jobs,
  index,
}) => {
  const files = await glob(patterns, {
    cwd: root,
    gitignore: true,
    ignore: ['node_modules'],
  });
  return files
    .sort()
    .filter((f, i) => i % jobs === index)
    .map(str => '.*/' + str)
    .join('|');
};

module.exports = {getChunkPattern};
