// @flow

const {isDepsetSubset} = require('./is-depset-subset.js');

/*::
import type {Metadata, PackageJson} from './get-local-dependencies.js'
import type {PayloadMetadata} from './get-test-groups.js'

export type GroupByDepsetsArgs = {
  root: string,
  metas: Array<Metadata>,
  group: Array<PayloadMetadata>,
}
export type GroupByDepsets = (GroupByDepsetsArgs) => Array<Array<PayloadMetadata>>;
*/
const groupByDepsets /*: GroupByDepsets */ = ({root, metas, group}) => {
  const pairs = getPairs({root, metas, group});
  const sorted = pairs.sort((a, b) => {
    const aDeps = a.meta.dependencies || {};
    const aDevDeps = a.meta.devDependencies || {};
    const aSize = Object.keys(aDeps).length + Object.keys(aDevDeps).length;

    const bDeps = b.meta.dependencies || {};
    const bDevDeps = b.meta.devDependencies || {};
    const bSize = Object.keys(bDeps).length + Object.keys(bDevDeps).length;

    return bSize - aSize;
  });
  const payload = [];
  let candidates = sorted;
  while (candidates.length > 0) {
    const base = candidates[0];
    const remaining = [];
    const grouped = [base.payload];
    for (let i = 1; i < candidates.length; i++) {
      const candidate = candidates[i];
      if (isDepsetSubset({of: base.meta, it: candidate.meta})) {
        grouped.push(candidate.payload);
      } else {
        remaining.push(candidate);
      }
    }
    payload.push(grouped);
    candidates = remaining;
  }
  return payload;
};

const getPairs = ({root, metas, group}) => {
  const map = new Map();
  return group
    .map(payload => {
      const {dir} = payload;
      const meta =
        map.get(dir) ||
        metas.find(meta => `${root}/${dir}`.startsWith(meta.dir));
      map.set(dir, meta);
      if (meta) return {meta: meta.meta, payload};
    })
    .filter(Boolean);
};

module.exports = {groupByDepsets};
