/* eslint-env node */

const fs = require('fs');
const path = require('path');
const test = require('tape');
const getPort = require('get-port');

const {run} = require('../../bin/cli-runner');

test('`fusion dev` works', async t => {
  const dir = path.resolve(__dirname, '../fixtures/noop');
  const entryPath = `.fusion/dist/development/server/server-main.js`;
  const entry = path.resolve(dir, entryPath);

  const {stop} = await run(
    `dev --dir=${dir} --no-open=true --port=${await getPort()}`
  );
  stop();
  t.ok(fs.existsSync(entry), 'Entry file gets compiled');
  t.end();
});

// TODO(#23) - fixme - make this work
// test('`fusion dev --test` works', async t => {
//   const dir = path.resolve(__dirname, '../fixtures/noop-test');
//   const entryPath = `.fusion/dist/development/server/server-main.js`;
//   const entry = path.resolve(dir, entryPath);

//   const {stop} = await run(`dev --dir=${dir} --test --port=${await getPort()}`);
//   stop();
//   t.ok(fs.existsSync(entry), 'Entry file gets compiled');
//   t.end();
// });
