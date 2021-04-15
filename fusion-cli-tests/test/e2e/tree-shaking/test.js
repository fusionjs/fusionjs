// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');

const fs = require('fs');
const {promisify} = require('util');
const request = require('axios');

const readdir = promisify(fs.readdir);

const {cmd} = require('../utils.js');

const dev = require('../setup.js');

const dir = path.resolve(__dirname, './fixture');

test('`fusion dev` works with fs', async () => {
  const app = dev(dir);
  await app.setup();
  const url = app.url();
  const {data: res} = await request(`${url}/fs`);
  t.ok(res.includes('writeFile'), 'supports fs api on the server');
  const {data: mainRes} = await request(`${url}/_static/client-main.js`);
  t.ok(
    mainRes.includes('fs (ignored)'),
    'includes empty fs for browser in dev'
  );
  app.teardown();
}, 100000);

test('`fusion build` tree shaking', async () => {
  await cmd(`build --dir=${dir} --production=true`);

  const serverMain = path.resolve(
    dir,
    `.fusion/dist/production/server/server-main.js`
  );
  const clientFiles = await readdir(
    path.resolve(dir, '.fusion/dist/production/client')
  );
  const clientMainFile = clientFiles.filter(f =>
    /client-main-(.*?).js$/.test(f)
  )[0];
  const clientMain = path.resolve(
    dir,
    '.fusion/dist/production/client',
    clientMainFile
  );

  // Manually instrumented
  t.ok(
    !fs
      .readFileSync(serverMain, 'utf-8')
      .includes('instrumented-as-pure-browser-plugin'),
    'should not include browserPlugin in node'
  );

  t.ok(
    !fs
      .readFileSync(clientMain, 'utf-8')
      .includes('instrumented-as-pure-node-plugin'),
    'should not include nodePlugin in browser'
  );

  // Default export
  t.ok(
    !fs
      .readFileSync(serverMain, 'utf-8')
      .includes('default-export-browser-plugin'),
    'should not include default browser export in node'
  );

  t.ok(
    !fs
      .readFileSync(clientMain, 'utf-8')
      .includes('default-export-node-plugin'),
    'should not include default node export in browser'
  );

  // Named export
  t.ok(
    !fs
      .readFileSync(serverMain, 'utf-8')
      .includes('named-export-browser-plugin'),
    'should not include named browser export in node'
  );

  t.ok(
    !fs.readFileSync(clientMain, 'utf-8').includes('named-export-node-plugin'),
    'should not include named node export in browser'
  );
}, 100000);
