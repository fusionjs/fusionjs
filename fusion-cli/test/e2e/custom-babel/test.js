// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const fs = require('fs');
const {promisify} = require('util');

const readFile = promisify(fs.readFile);
const exists = promisify(fs.exists);

const {cmd} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

test('compiles with babel plugin', async () => {
  await cmd(`build --dir=${dir}`);
  const serverEntryPath = path.resolve(
    dir,
    `.fusion/dist/development/server/server-main.js`
  );
  const clientEntryPath = path.resolve(
    dir,
    `.fusion/dist/development/client/client-main.js`
  );
  const clientVendorPath = path.resolve(
    dir,
    `.fusion/dist/development/client/client-vendor.js`
  );

  t.ok(await exists(clientEntryPath), 'Client file gets compiled');
  t.ok(await exists(clientVendorPath), 'Client vendor file gets compiled');
  t.ok(await exists(serverEntryPath), 'Server file gets compiled');

  const clientEntry = await readFile(clientEntryPath, 'utf8');
  const clientVendorEntry = await readFile(clientVendorPath, 'utf8');
  const serverEntry = await readFile(serverEntryPath, 'utf8');
  t.ok(
    clientEntry.includes('transformed_custom_babel'),
    'custom plugin applied in client'
  );
  t.ok(
    serverEntry.includes('transformed_custom_babel'),
    'custom plugin applied in server'
  );
  t.ok(
    clientVendorEntry.includes('transformed_custom_babel'),
    'babel plugin runs against node_modules'
  );
  t.ok(
    clientVendorEntry.includes('helloworld'),
    'babel plugin does not run against blacklist'
  );
}, 100000);
