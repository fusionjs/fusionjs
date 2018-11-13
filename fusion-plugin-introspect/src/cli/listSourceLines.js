// @flow

/*::
import type {Dep, Source} from './types.js';
*/

module.exports.listSourceLines = (
  dep /*: Dep */,
  type /*: string */
) /*: Array<string> */ => {
  return dep.sources
    .filter(item => item.type === type)
    .map(item => item.source);
};
