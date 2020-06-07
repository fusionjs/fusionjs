// @flow
const {getBinaryPath} = require('../utils/binary-paths.js');

/*::
import type {BinName} from '../utils/binary-paths.js'
*/
function binPath(name /*: BinName */) {
  console.log(getBinaryPath(name));
}

module.exports = {binPath};
