// @flow
/*::
import type {DepData} from './types.js';
*/
const {listDependencies} = require('./listDependencies.js');

module.exports.getMaxWordWidth = (data /*: Array<DepData> */) /*: number */ => {
  return Math.max(...listDependencies(data).map(dep => dep.name.length));
};
