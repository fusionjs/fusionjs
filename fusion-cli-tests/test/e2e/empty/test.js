// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');

const getPort = require('get-port');

const dir = path.resolve(__dirname, './fixture');

const {cmd} = require('../utils.js');

jest.setTimeout(15000);

test('generates error if missing default export', async () => {
  await cmd(`build --dir=${dir}`);

  const promise = cmd(`start --dir=${dir} --port=${await getPort()}`, {
    stdio: 'pipe',
  });
  // $FlowFixMe
  const {proc} = promise;

  try {
    await promise;
    // $FlowFixMe
    t.fail('did not error');
  } catch (e) {
    t.ok(e.stderr.includes(' is not a function'));
  } finally {
    proc.kill('SIGKILL');
  }
});
