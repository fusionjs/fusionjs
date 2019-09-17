// @flow

const {intersects} = require('semver');

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
    if (!(key in superset) || !intersects(deps[key], superset[key])) {
      return false;
    }
  }
  return true;
};

module.exports = {isDepsetSubset};
