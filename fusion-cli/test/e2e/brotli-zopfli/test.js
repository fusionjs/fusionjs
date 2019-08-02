// @flow
/* eslint-env node */

const path = require('path');
const fs = require('fs');
const {promisify} = require('util');
const t = require('assert');

const exists = promisify(fs.exists);

const {cmd} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');
const dir2 = path.resolve(__dirname, './fixture2');

test('respects .fusionrc for zopfli and brotli', async () => {
  await cmd(`build --dir=${dir} --production`);

  const clientMainPathGZ = path.resolve(
    dir,
    `.fusion/dist/production/client/client-main-c9d5e15139c37dc8d00d.js.gz`
  );

  t.ok(
    !(await exists(clientMainPathGZ)),
    "Zopfli Was Made, but shouldn't have"
  );

  const clientMainPathBR = path.resolve(
    dir,
    `.fusion/dist/production/client/client-main-c9d5e15139c37dc8d00d.js.br`
  );

  t.ok(
    !(await exists(clientMainPathBR)),
    "Brotli Was Made, but shouldn't have"
  );

  await cmd(`build --dir=${dir2} --production`);

  const clientMainPathGZ2 = path.resolve(
    dir2,
    `.fusion/dist/production/client/client-main-69fef501aaf7ef73ab62.js.gz`
  );

  t.ok(await exists(clientMainPathGZ2), "Zopfli Wasn't Made, but should have");

  const clientMainPathBR2 = path.resolve(
    dir2,
    `.fusion/dist/production/client/client-main-69fef501aaf7ef73ab62.js.br`
  );

  t.ok(await exists(clientMainPathBR2), "Brotli Wasn't Made, but should have");
}, 100000);
