// @flow
/*::
import type {Metadata} from './get-local-dependencies.js';

export type GetDownstreams = (Array<Metadata>, Metadata) => Array<Metadata>
*/
const getDownstreams /*: GetDownstreams */ = (deps, dep) => {
  return getDedupedDownstreams(deps, dep).slice(1);
};
const getDedupedDownstreams = (deps, dep, set = new Set()) => {
  const downstreams = [dep];
  if (!set.has(dep.dir)) {
    set.add(dep.dir);
    for (const item of deps) {
      const names = {
        ...item.meta.dependencies,
        ...item.meta.devDependencies,
      };
      if (dep.meta.name in names && !set.has(item.dir)) {
        downstreams.push(...getDedupedDownstreams(deps, item, set));
      }
    }
  }
  return downstreams;
};

module.exports = {getDownstreams};
