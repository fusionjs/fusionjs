// @flow

/*::
import type {PackageJson} from './get-local-dependencies.js';

type IsYarnResolutionArgs = {
  meta: PackageJson,
  name: string,
}
type IsYarnResolution = (IsYarnResolutionArgs) => boolean
*/
const isYarnResolution /*: IsYarnResolution */ = ({meta, name}) => {
  return !!Object.keys(meta.resolutions || {}).find(resolution => {
    const [resolved] = resolution.match(/(@[^/]+\/)?[^@/]+$/) || [];
    return resolved === name;
  });
};

module.exports = {isYarnResolution};
