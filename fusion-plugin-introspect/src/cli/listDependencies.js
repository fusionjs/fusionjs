// @flow

/*::
import type {DepData, Dep} from './types.js';
*/

module.exports.listDependencies = (
  data /*: Array<DepData>*/
) /*: Array<Dep>*/ => {
  return [].concat(...data.map(item => item.dependencies));
};
