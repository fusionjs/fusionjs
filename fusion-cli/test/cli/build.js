/* eslint-env node */
const fs = require('fs');
const path = require('path');
const test = require('tape');

const {run} = require('../../bin/cli-runner');

test('`fusion build` works', async t => {
  const dir = path.resolve(__dirname, '../fixtures/noop');
  const serverEntryPath = path.resolve(
    dir,
    `.fusion/dist/development/server/server-main.js`
  );
  const serverMapPath = path.resolve(
    dir,
    `.fusion/dist/development/server/server-main.js.map`
  );
  const clientMain = path.resolve(
    dir,
    `.fusion/dist/development/client/client-main.js`
  );
  const clientMainMap = path.resolve(
    dir,
    `.fusion/dist/development/client/client-main.js.map`
  );
  const clientMainVendor = path.resolve(
    dir,
    `.fusion/dist/development/client/client-vendor.js`
  );
  // TODO(#112): Enable failing test
  // const clientMainVendorMap = path.resolve(
  //   dir,
  //   `.fusion/dist/development/client/client-vendor.js.map`
  // );
  await run(`build --dir=${dir}`);
  t.ok(fs.existsSync(serverEntryPath), 'Server Entry file gets compiled');
  t.ok(
    fs.existsSync(serverMapPath),
    'Server Entry file sourcemap gets compiled'
  );
  t.ok(fs.existsSync(clientMain), 'Client Entry file gets compiled');
  t.ok(
    fs.existsSync(clientMainMap),
    'Client Entry file sourcemap gets compiled'
  );
  t.ok(fs.existsSync(clientMainVendor), 'Client vendor file gets compiled');
  // TODO(#112): Enable failing test
  // t.ok(
  //   fs.existsSync(clientMainVendorMap),
  //   'Client vendor file sourcemap gets compiled'
  // );
  t.end();
});

test('`fusion build` works in production', async t => {
  const dir = path.resolve(__dirname, '../fixtures/noop');
  const serverEntryPath = path.resolve(
    dir,
    `.fusion/dist/production/server/server-main.js`
  );
  const serverMapPath = path.resolve(
    dir,
    `.fusion/dist/production/server/server-main.js.map`
  );
  const clientMain = path.resolve(
    dir,
    `.fusion/dist/production/client/client-main-b146db6e5d21f0eee531.js`
  );
  const clientMainMap = path.resolve(
    dir,
    `.fusion/dist/production/client/client-main-b146db6e5d21f0eee531.js.map`
  );
  // TODO(#112): Enable failing test
  // const clientMainVendor = path.resolve(
  //   dir,
  //   `.fusion/dist/production/client/client-vendor-75c3b5ea4d2e744ae2ad.js`
  // );
  // const clientMainVendorMap = path.resolve(
  //   dir,
  //   `.fusion/dist/production/client/client-vendor-75c3b5ea4d2e744ae2ad.js.map`
  // );
  // const port = await getPort();
  await run(`build --dir=${dir} --production`);
  t.ok(fs.existsSync(serverEntryPath), 'Server Entry file gets compiled');
  t.ok(
    fs.existsSync(serverMapPath),
    'Server Entry file sourcemap gets compiled'
  );
  t.ok(fs.existsSync(clientMain), 'Client Entry file gets compiled');
  t.ok(
    fs.existsSync(clientMainMap),
    'Client Entry file sourcemap gets compiled'
  );
  // TODO(#112): Enable failing test
  // t.ok(fs.existsSync(clientMainVendor), 'Client vendor file gets compiled');
  // t.ok(
  //   fs.existsSync(clientMainVendorMap),
  //   'Client vendor file sourcemap gets compiled'
  // );
  t.end();
});
