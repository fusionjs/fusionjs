// @flow
/*::
import type {Dep} from '../cli/types.js';
*/

const {listSourceLines} = require('./listSourceLines');

module.exports.describeUsage = (dep /*: Dep */, token /*: string */) => {
  const verbs = {
    token: ' is declared in',
    register: ' is registered in',
    plugin: `'s plugin is created in`,
    'alias-from': ' is aliased to another token in', // alias-from is being aliased to alias-to
    'alias-to': ' is aliased from another token in',
  };
  return Object.keys(verbs)
    .map((type) => {
      const lines = listSourceLines(dep, type);
      if (lines.length > 0) {
        //eslint-disable-next-line
        return `${token}${verbs[type]}:\n  ${lines.join('\n ')}\n`;
      }
    })
    .filter(Boolean)
    .join('\n');
};
