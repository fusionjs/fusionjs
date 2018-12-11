// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const fs = require('fs');
const {promisify} = require('util');

const exists = promisify(fs.exists);

const {cmd, run} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

test('`fusion build` with dynamic imports', async () => {
  await cmd(`build --dir=${dir}`);

  // Execute node script to validate dynamic imports
  const entryPath = `.fusion/dist/development/server/server-main.js`;
  const entry = path.resolve(dir, entryPath);
  // $FlowFixMe
  const {stdout} = await run(entry, {stdio: 'pipe'});
  const testContent = JSON.parse(stdout);
  t.ok(
    testContent.dynamicContent.includes('loaded dynamic import'),
    'dynamic import is executed'
  );
  t.deepEqual(
    testContent.chunkIds,
    [[10003, 0], [10004, 1]],
    'Chunk IDs are populated'
  );

  t.ok(
    await exists(
      path.resolve(dir, `.fusion/dist/development/client/client-0.js`)
    ),
    'client dynamic import bundle exists'
  );
}, 100000);
