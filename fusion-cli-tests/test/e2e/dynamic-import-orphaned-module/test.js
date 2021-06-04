// @flow
/* eslint-env node */

const t = require('assert');
const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const {cmd} = require('../utils.js');

const readdir = promisify(fs.readdir);
const dir = path.resolve(__dirname, './fixture');

test('`fusion build` with dynamic imports', async () => {
  await cmd(`build --dir=${dir}`);

  // Build completes
  t.ok(true);

  const bundles = await readdir(
    path.resolve(dir, '.fusion/dist/development/client')
  );

  const asyncBundles = bundles.filter((f) => !/(vendor|runtime|main)/.test(f));

  // No async bundles are created
  t.equal(asyncBundles.length, 0);
}, 100000);
