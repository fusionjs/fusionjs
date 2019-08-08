// @flow
const {sync} = require('./lockfile.js');

/*::
import type {Metadata} from './get-local-dependencies.js';

export type GenerateDepLockfilesArgs = {
  root: string,
  deps: Array<Metadata>,
  ignore: Array<Metadata>,
  frozenLockfile?: boolean,
};
export type GenerateDepLockfiles = (GenerateDepLockfilesArgs) => Promise<void>
*/
const generateDepLockfiles /*: GenerateDepLockfiles */ = async ({
  root,
  deps,
  ignore,
  frozenLockfile = false,
}) => {
  const roots = deps.map(dep => dep.dir);
  const tmp = `${root}/third_party/jazelle/temp/yarn-utilities-tmp`;
  await sync({
    roots,
    ignore: ignore.map(dep => dep.meta.name),
    tmp,
    frozenLockfile,
  });
};

module.exports = {generateDepLockfiles};
