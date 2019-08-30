// @flow

/*::
import type {LockfileEntry} from './lockfile.js';
export type PrependRegistryToLockFileEntry = (LockfileEntry, string) => LockfileEntry
*/
const prependRegistryToLockfileEntry /*: PrependRegistryToLockFileEntry */ = (
  lockfileEntry,
  registry
) => {
  if (!lockfileEntry || !registry) {
    return lockfileEntry;
  }
  const cleanRegistry =
    registry[registry.length - 1] === '/' ? registry : registry + '/';
  const cleanResolved =
    lockfileEntry.resolved[0] === '/'
      ? lockfileEntry.resolved.slice(1)
      : lockfileEntry.resolved;
  return {
    ...lockfileEntry,
    resolved: cleanRegistry + cleanResolved,
  };
};
module.exports = {prependRegistryToLockfileEntry};
