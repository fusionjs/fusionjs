// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const fs = require('fs');
const {promisify} = require('util');
const getPort = require('get-port');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

const {cmd, run} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

test('development env globals', async () => {
  await cmd(`build --dir=${dir}`);

  const entryPath = `.fusion/dist/development/server/server-main.js`;
  const entry = path.resolve(dir, entryPath);

  // Validate browser globals by file content
  const clientDir = path.resolve(dir, `.fusion/dist/development/client`);
  const assets = await readdir(clientDir);
  const clientEntry = assets.find(a => a.match(/^client-main.*\.js$/));
  const clientEntryPath = path.resolve(
    dir,
    `.fusion/dist/development/client/${clientEntry}`
  );
  const clientContent = await readFile(clientEntryPath, 'utf8');

  t.ok(
    clientContent.includes(`'main __BROWSER__ is', true`),
    `__BROWSER__ is transpiled to be true in development`
  );
  t.ok(
    clientContent.includes(`'main __NODE__ is', false`),
    '__NODE__ is transpiled to be false'
  );

  // Validate node globals by execution
  const command = `
    const assert = require('assert');
    const app = require('${entry}');
    assert.equal(typeof app.start, 'function', 'Entry has start function');
    app
      .start({port: ${await getPort()}})
      .then(server => {
        server.close();
      })
      .catch(e => {
        setImmediate(() => {
          throw e;
        });
      });
    `;
  // $FlowFixMe
  const {stdout} = await run(['-e', command], {stdio: 'pipe'});
  t.ok(
    stdout.includes('main __BROWSER__ is false'),
    'the global, __BROWSER__, is false'
  );
  t.ok(stdout.includes(`main __DEV__ is true`), `the global, __DEV__, is true`);
  t.ok(
    stdout.includes('main __NODE__ is true'),
    'the global, __NODE__, is true'
  );
}, 100000);

test('production env globals', async () => {
  await cmd(`build --dir=${dir} --production`, {
    env: {...process.env, NODE_ENV: 'production'},
  });
  // Validate browser globals by file content
  const clientDir = path.resolve(dir, `.fusion/dist/production/client`);
  const assets = await readdir(clientDir);
  const clientEntry = assets.find(a => a.match(/^client-main.*\.js$/));
  const clientEntryPath = path.resolve(
    dir,
    `.fusion/dist/production/client/${clientEntry}`
  );
  const clientContent = await readFile(clientEntryPath, 'utf8');

  const entryPath = `.fusion/dist/production/server/server-main.js`;
  const entry = path.resolve(dir, entryPath);

  t.ok(
    clientContent.includes('"main __BROWSER__ is",!0'),
    `__BROWSER__ is transpiled to be true in production`
  );

  t.ok(
    clientContent.includes('"main __NODE__ is",!1'),
    '__NODE__ is transpiled to be false'
  );

  // Validate node globals by execution
  const command = `
    const assert = require('assert');
    const app = require('${entry}');
    assert.equal(typeof app.start, 'function', 'Entry has start function');
    app
      .start({port: ${await getPort()}})
      .then(server => {
        server.close();
      })
      .catch(e => {
        setImmediate(() => {
          throw e;
        });
      });
    `;
  // $FlowFixMe
  const {stdout} = await run(['-e', command], {
    stdio: 'pipe',
    env: {...process.env, NODE_ENV: 'production'},
  });
  t.ok(
    stdout.includes('main __BROWSER__ is false'),
    'the global, __BROWSER__, is false'
  );
  t.ok(
    stdout.includes(`main __DEV__ is false`),
    `the global, __DEV__, is false`
  );
  t.ok(
    stdout.includes('main __NODE__ is true'),
    'the global, __NODE__, is true'
  );
}, 100000);
