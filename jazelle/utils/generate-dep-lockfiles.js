// @flow
const {regenerate} = require('./lockfile.js');
const {remove, lstat} = require('./node-helpers.js');

/*::
import type {Metadata} from './get-local-dependencies.js';

export type GenerateDepLockfilesArgs = {
  root: string,
  deps: Array<Metadata>,
  ignore: Array<Metadata>,
  frozenLockfile: boolean,
  conservative: boolean,
};
export type GenerateDepLockfiles = (GenerateDepLockfilesArgs) => Promise<void>
*/
const generateDepLockfiles /*: GenerateDepLockfiles */ = async ({
  root,
  deps,
  ignore,
  frozenLockfile = false,
  conservative = false,
}) => {
  const roots = deps.map(dep => dep.dir);
  if (await shouldRegenerate({roots})) {
    const tmp = `${root}/third_party/jazelle/temp/yarn-utilities-tmp`;
    await regenerate({
      roots,
      ignore: ignore.map(dep => dep.meta.name),
      tmp,
      frozenLockfile,
      conservative,
    });
    await remove(tmp);
  }
};

const shouldRegenerate = async ({roots}) => {
  const meta = await Promise.all(
    roots.map(async dir => {
      const metaFile = `${dir}/package.json`;
      const metaStat = await lstat(metaFile).catch(() => ({mtimeMs: 0}));
      return metaStat.mtimeMs;
    })
  );
  const highestMeta = Math.max(...meta);
  const lock = await Promise.all(
    roots.map(async dir => {
      const yarnLock = `${dir}/yarn.lock`;
      const lockStat = await lstat(yarnLock).catch(() => ({mtimeMs: -1}));
      return lockStat.mtimeMs;
    })
  );
  const highestLock = Math.max(...lock);
  return highestMeta > highestLock;
};

module.exports = {generateDepLockfiles};
