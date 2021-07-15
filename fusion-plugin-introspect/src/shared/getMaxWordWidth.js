// @flow
/*::
import type {DepData} from '../cli/types.js';
*/
const {listDependencies} = require('../shared/listDependencies.js');

module.exports.getMaxWordWidth = (data /*: Array<DepData> */) /*: number */ => {
  return Math.max(...listDependencies(data).map((dep) => dep.name.length));
};
