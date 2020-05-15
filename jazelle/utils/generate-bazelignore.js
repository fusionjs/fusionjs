// @flow
const {read, write} = require('./node-helpers.js');

/*::
export type GenerateBazelignoreArgs = {
  root: string,
  projects: Array<string>,
};
export type GenerateBazelignore = (GenerateBazelignoreArgs) => Promise<void>;
*/

const generateBazelignore /*: GenerateBazelignore */ = async ({
  root,
  projects,
}) => {
  const file = `${root}/.bazelignore`;
  const bazelignore = await read(file, 'utf8').catch(() => '');

  const ignorePaths = [
    ...new Set([
      'third_party/jazelle/temp',
      'node_modules',
      ...bazelignore.split('\n'),
      ...projects.map(p => `${p}/node_modules`),
    ]),
  ];
  const updated = ignorePaths
    .sort()
    .filter(Boolean)
    .join('\n');
  if (bazelignore !== updated)
    await write(`${root}/.bazelignore`, updated, 'utf8');
};

module.exports = {generateBazelignore};
