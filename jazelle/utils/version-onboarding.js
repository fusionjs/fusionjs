// @flow

const {compare, minVersion, validRange} = require('../utils/cached-semver.js');

/*::
import type {VersionPolicy} from './get-manifest.js'

type ShouldSyncArgs = {
  versionPolicy: VersionPolicy,
  name: string,
};
type ShouldSync = (ShouldSyncArgs) => boolean;
*/
const shouldSync /*: ShouldSync */ = ({versionPolicy, name}) => {
  const {
    lockstep = false,
    exceptions = [],
  } /*: VersionPolicy */ = versionPolicy;
  return (
    (lockstep && !exceptions.includes(name)) ||
    (!lockstep &&
      exceptions.map(e => (typeof e === 'string' ? e : e.name)).includes(name))
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
  const types = ['dependencies', 'devDependencies'];
  const versions = [];
  for (const {meta} of deps) {
    for (const type of types) {
      for (const key in meta[type]) {
        if (name === key) versions.push(meta[type][key]);
      }
    }
  }
  // Sort all used versions according to SemVer and select the largest version.
  // Ranges are reduced to their minimum satisfying version.
  // If a version isn't valid semver, assume it takes precedence
  versions.sort((a, b) => {
    const aValid = validRange(a);
    const bValid = validRange(b);
    if (!aValid && !bValid && a === b) return 0;
    if (!aValid) return -1;
    if (!bValid) return 1;

    const aVersion = minVersion(a).version;
    const bVersion = minVersion(b).version;
    return compare(aVersion, bVersion) * -1;
  });
  return versions.length === 0 ? '' : versions[0];
};

module.exports = {shouldSync, getVersion};
