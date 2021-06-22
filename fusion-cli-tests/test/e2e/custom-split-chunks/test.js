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

test('compiles with custom splitChunks config', async () => {
  await cmd(`build --dir=${dir}`);
  const serverEntryPath = path.resolve(
    dir,
    `.fusion/dist/development/server/server-main.js`
  );
  const clientEntryPath = path.resolve(
    dir,
    `.fusion/dist/development/client/client-main.js`
  );
  const clientVendorReactPath = path.resolve(
    dir,
    `.fusion/dist/development/client/client-vendor-react.js`
  );
  const clientVendorMapboxPath = path.resolve(
    dir,
    `.fusion/dist/development/client/client-vendor-mapbox.js`
  );
  const clientNodeModuleChunkPath = path.resolve(
    dir,
    `.fusion/dist/development/client/client-node_modules_other_index_js.js`
  );

  t.ok(await exists(clientEntryPath), 'Client file gets compiled');
  t.ok(
    await exists(clientVendorReactPath),
    'Client vendor-react file gets compiled'
  );
  t.ok(
    await exists(clientVendorMapboxPath),
    'Client vendor-mapbox file gets compiled'
  );
  t.ok(
    await exists(clientNodeModuleChunkPath),
    'chunk bundle is created from node_modules/other'
  );
  t.ok(await exists(serverEntryPath), 'Server file gets compiled');

  const clientVendorReactEntry = await readFile(clientVendorReactPath, 'utf8');
  const clientVendorMapboxEntry = await readFile(
    clientVendorMapboxPath,
    'utf8'
  );
  const clientNodeModuleChunkEntry = await readFile(
    clientNodeModuleChunkPath,
    'utf8'
  );
  t.ok(
    clientVendorReactEntry.includes('/node_modules/react/'),
    'react vendor bundle includes react'
  );
  t.ok(
    clientVendorMapboxEntry.includes('/node_modules/mapbox-gl/'),
    'mapbox vendor bundle includes mapbox'
  );
  t.ok(
    clientNodeModuleChunkEntry.includes('/node_modules/other/'),
    'node module chunk includes other'
  );
}, 100000);
