// @flow
/*::
import type {Dep} from '../cli/types.js';
*/

const graphChildren = (
  deps /*: Array<Dep>*/,
  token /*: string */,
  fork /*: bool */ = true,
  level /*: number */ = 0
) => {
  const indent = `${fork ? '│' : ' '}  `.repeat(level);
  const self = deps.find((dep) => dep.name === token);
  if (!self) return '';
  const children = self.dependencies
    .map((dep, i, {length}) => {
      const fork = i < length - 1;
      const line = fork ? '├─' : '└─';
      const children = graphChildren(deps, dep, fork, level + 1);
      return `${indent}${line} ${dep}\n${children}`;
    })
    .join('');
  return children;
};

module.exports.graphChildren = graphChildren;
