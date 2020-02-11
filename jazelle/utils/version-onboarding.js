// @flow

/*::
import type {VersionPolicy} from './get-manifest.js'

type ShouldSyncArgs = {
  versionPolicy: VersionPolicy,
  name: string,
};
type ShouldSync = (ShouldSyncArgs) => boolean;
*/
const shouldSync /*: ShouldSync */ = ({versionPolicy, name}) => {
  const {lockstep = false, exceptions = []} = versionPolicy;
  return (
    (lockstep && !exceptions.includes(name)) ||
    (!lockstep && exceptions.includes(name))
  );
};

/*::
import type {Metadata} from './get-local-dependencies.js'

type GetVersionArgs = {
  name: string,
  deps: Array<Metadata>,
}
type GetVersion = (GetVersionArgs) => string
*/
const getVersion /*: GetVersion */ = ({name, deps}) => {
  const types = ['dependencies', 'devDependencies', 'resolutions'];
  for (const {meta} of deps) {
    for (const type of types) {
      for (const key in meta[type]) {
        if (name === key) return meta[type][key];
      }
    }
  }
  return '';
};

module.exports = {shouldSync, getVersion};
