// @flow

const {validRange, intersects} = require('semver');

/*::
import type {PackageJson} from './get-local-dependencies.js';

type IsDepsetSubsetArgs = {
  of: PackageJson,
  it: PackageJson,
}
type IsDepsetSubset = (IsDepsetSubsetArgs) => boolean
*/
const isDepsetSubset /*: IsDepsetSubset */ = ({of, it}) => {
  const superset = {...of.devDependencies, ...of.dependencies};
  const deps = {...it.devDependencies, ...it.dependencies};
  for (const key in deps) {
    if (!(key in superset)) return false;

    const isSubValid = !!validRange(deps[key]);
    const isSuperValid = !!validRange(superset[key]);
    if (!isSubValid && !isSuperValid) {
      return deps[key] === superset[key];
    }
    if (isSubValid !== isSuperValid) {
      return false;
    }
    if (!intersects(deps[key], superset[key])) {
      return false;
    }
  }
  return true;
};

module.exports = {isDepsetSubset};
