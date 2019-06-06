// @flow
const {sync} = require('yarn-utilities');

/*::
import type {Metadata} from './get-local-dependencies.js';

export type GenerateDepLockfilesArgs = {
  deps: Array<Metadata>,
};
export type GenerateDepLockfiles = (GenerateDepLockfilesArgs) => Promise<void>
*/
const generateDepLockfiles /*: GenerateDepLockfiles */ = async ({deps}) => {
  const dirs = deps.map(dep => dep.dir);
  await sync({roots: dirs, ignore: deps.map(dep => dep.meta.name)});
};

module.exports = {generateDepLockfiles};
