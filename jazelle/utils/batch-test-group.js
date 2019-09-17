// @flow

const {spawn} = require('../utils/node-helpers.js');
const {node} = require('../utils/binary-paths.js');

/*::
import type {PayloadMetadata} from './get-test-groups.js';
import type {Stdio} from './node-helpers.js';

type BatchTestGroupArgs = {
  root: string,
  data: Array<Array<PayloadMetadata>>,
  index: number,
  cores: number,
  stdio?: Stdio,
}
type BatchTestGroup = (BatchTestGroupArgs) => Promise<void>
*/
const batchTestGroup /*: BatchTestGroup */ = async ({
  root,
  data,
  index,
  cores,
  stdio = 'inherit',
}) => {
  await spawn(
    node,
    [
      `${__dirname}/../bin/cluster.js`,
      '--root',
      root,
      '--plan',
      JSON.stringify(data), // serialize as single line
      '--index',
      String(index),
      '--cores',
      String(cores),
    ],
    {stdio, cwd: root, env: process.env}
  );
};

module.exports = {batchTestGroup};
