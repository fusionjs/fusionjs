// @flow
const {satisfies} = require('semver');
const {read} = require('./node-helpers.js');

/*::
export type GetLocalDependenciesArgs = {
  dirs: Array<string>,
  target: string,
};
export type GetLocalDependencies = (GetLocalDependenciesArgs) => Promise<Array<Metadata>>;
export type Metadata = {
  dir: string,
  meta: PackageJson,
  depth: number,
};
export type PackageJson = {
  name: string,
  version: string,
  bin?: string | {[string]: string},
  scripts?: {[string]: string},
  dependencies?: {[string]: string},
  devDependencies?: {[string]: string},
  peerDependencies?: {[string]: string},
  optionalDependencies?: {[string]: string},
  resolutions?: {[string]: string},
};
*/
const getLocalDependencies /*: GetLocalDependencies */ = async ({
  dirs,
  target,
}) => {
  const data = await Promise.all([
    ...dirs.map(async dir => {
      const meta = JSON.parse(await read(`${dir}/package.json`, 'utf8'));
      return {dir, meta, depth: 1};
    }),
  ]);
  return unique(findDependencies(data, target));
};

function findDependencies(data, target, depth = 1, set = new Set()) {
  const output = [];
  const item = data.find(item => item.dir === target);
  if (item && !set.has(target)) {
    set.add(target);
    const fields = ['dependencies', 'devDependencies'];
    for (const field of fields) {
      const deps = item.meta[field] || {};
      Object.keys(deps).forEach(dep => {
        const found = data.find(item => {
          return (
            item.meta.name === dep && satisfies(item.meta.version, deps[dep])
          );
        });
        if (found && !set.has(found.dir)) {
          const children = findDependencies(data, found.dir, depth + 1, set);
          output.push(...children, found);
        }
      });
    }
    item.depth = depth;
    output.push(item);
  }
  return output;
}

function unique(data) {
  const map = new Map();
  for (const item of data.reverse()) {
    map.set(item.dir, item); // if there are dupes, keep the one w/ higher depth
  }
  return [...map.values()].reverse();
}

module.exports = {getLocalDependencies};
