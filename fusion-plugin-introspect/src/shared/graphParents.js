// @flow
/*::
import type {Dep} from '../cli/types.js';
*/

const graphParents = (
  deps /*: Array<Dep>*/,
  token /*: string */,
  fork /*: bool */ = true,
  level /*: number */ = 0
) => {
  const indent = `${fork ? '│' : ' '}  `.repeat(level);
  const parents = deps
    .filter((dep) => dep.dependencies.find((name) => name === token))
    .map(({name}, i, {length}) => {
      const fork = i < length - 1;
      const line = fork ? '├─' : '└─';
      const parents = graphParents(deps, name, fork, level + 1);
      return `${indent}${line} ${name}\n${parents}`;
    })
    .join('\n');
  return parents;
};

module.exports.graphParents = graphParents;
