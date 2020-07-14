// @flow
const {read, write} = require('./node-helpers.js');

/*::
export type GenerateBazelignoreArgs = {
  root: string,
};
export type GenerateBazelignore = (GenerateBazelignoreArgs) => Promise<void>;
*/

const generateBazelignore /*: GenerateBazelignore */ = async ({root}) => {
  const file = `${root}/.bazelignore`;
  const bazelignore = await read(file, 'utf8').catch(() => '');

  const ignorePaths = [
    ...new Set([
      'third_party/jazelle/temp',
      'node_modules',
      ...bazelignore.split('\n'),
    ]),
  ];
  const updated = ignorePaths
    .sort()
    .filter(Boolean)
    .join('\n');
  if (bazelignore.trim() !== updated.trim()) {
    await write(`${root}/.bazelignore`, updated + '\n', 'utf8');
  }
};

module.exports = {generateBazelignore};
