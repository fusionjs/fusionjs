// @flow

const {spawn, read, remove, exists} = require('../utils/node-helpers.js');
const {node} = require('../utils/binary-paths.js');
const {tmpdir} = require('os');

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
type BatchTestGroup = (BatchTestGroupArgs) => Promise<Array<PayloadMetadata>>
*/
const batchTestGroup /*: BatchTestGroup */ = async ({
  root,
  data,
  index,
  cores,
  stdio = 'inherit',
}) => {
  const log = `${tmpdir()}/${Math.random() * 1e17}`;
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
      '--log',
      log,
    ],
    {stdio, cwd: root, env: process.env}
  );
  if (await exists(log)) {
    const failed = JSON.parse(await read(log, 'utf8'));
    await remove(log);
    return failed;
  } else {
    return [];
  }
};

module.exports = {batchTestGroup};
