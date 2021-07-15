// @flow
/*::
import type {Dep} from '../cli/types.js';
*/

const {listSourceLines} = require('./listSourceLines');

module.exports.describeType = (dep /*: Dep */, token /*: string */) => {
  const isPlugin = listSourceLines(dep, 'plugin').length > 0;
  if (isPlugin) {
    const types = {
      service: 'plugin w/ a `provides` method',
      middleware: 'plugin w/ a `middleware` method',
      both: 'plugin w/ a `provides` and `middleware` methods',
      value: 'value',
      noop: 'plugin without methods',
    };
    //eslint-disable-next-line
    return `${token} token is registered with a ${types[dep.type]}\n`;
  }
  return '';
};
