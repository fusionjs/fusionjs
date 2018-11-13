// @flow
/*::
import type {Schema} from './types.js';
*/
const fs = require('fs');
const util = require('util');

module.exports.parseRuntimeMetadata = async () /*: Promise<Schema> */ => {
  try {
    const readFile = util.promisify(fs.readFile);
    return JSON.parse(await readFile('.fusion/fusion-stats.json', 'utf8'));
  } catch (e) {
    throw new Error('No runtime data found. Run your app first');
  }
};
