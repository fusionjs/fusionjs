// @flow
const {satisfies} = require('./cached-semver');

/*::
import type {Metadata} from './get-local-dependencies.js';

export type DetectCyclicDepsArgs = {
  deps: Array<Metadata>,
};
export type DetectCyclicDeps = (DetectCyclicDepsArgs) => Array<Array<Metadata>>;
*/
const detectCyclicDeps /*: DetectCyclicDeps */ = ({deps}) => {
  const cycles = [];
  for (const dep of deps) {
    collect(deps, dep, cycles);
  }
  const map = {};
  for (const cycle of cycles) {
    map[cycle.sort().join()] = cycle;
  }

  return Object.keys(map).map(key => map[key]);
};
const collect = (deps, dep, cycles, set = new Set()) => {
  const parent = deps.find(d => {
    const types = ['dependencies', 'devDependencies'];
    for (const type of types) {
      if (d.meta[type]) {
        const range = d.meta[type][dep.meta.name];
        if (range && satisfies(dep.meta.version, range)) {
          return true;
        }
      }
    }
    return false;
  });
  if (parent) {
    if (set.has(dep)) {
      cycles.push([...set]);
    } else {
      set.add(dep);
      collect(deps, parent, cycles, set);
    }
  }
};

module.exports = {detectCyclicDeps};
