// @flow
/*::
import type {DepData, Dep} from './types.js';
*/
module.exports.sortDependencies = (deps /*: Array<Dep>*/) /*:Array<Dep> */ => {
  const list = [];
  deps.forEach(dep => {
    collectDepsByDepth(deps, dep, list);
  });
  return list;
};
const collectDepsByDepth = (deps, dep, list) => {
  if (dep.dependencies.length === 0) collectDep(list, dep);
  else {
    dep.dependencies.forEach(sub => {
      const dep = deps.find(dep => dep.name === sub);
      if (dep) {
        collectDepsByDepth(deps, dep, list);
      }
    });
    collectDep(list, dep);
  }
};
const collectDep = (list, dep) => {
  if (!list.find(item => item.name === dep.name)) list.push(dep);
};
