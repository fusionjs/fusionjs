// @flow
const {sync} = require('yarn-utilities');

/*::
import type {Metadata} from './get-local-dependencies.js';

export type GenerateDepLockfilesArgs = {
  root: string,
  deps: Array<Metadata>,
};
export type GenerateDepLockfiles = (GenerateDepLockfilesArgs) => Promise<void>
*/
const generateDepLockfiles /*: GenerateDepLockfiles */ = async ({
  root,
  deps,
}) => {
  const roots = deps.map(dep => dep.dir);
  const tmp = `${root}/third_party/jazelle/temp/yarn-utilities-tmp`;
  await sync({roots, ignore: deps.map(dep => dep.meta.name), tmp});
};

module.exports = {generateDepLockfiles};
