// @flow
/* eslint-env node */

const path = require('path');
const fs = require('fs');
const babel = require('@babel/core');
const {promisify} = require('util');
const t = require('assert');

const exists = promisify(fs.exists);
const readFile = promisify(fs.readFile);

const {cmd} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

test('transpiles node_modules', async () => {
  await cmd(`build --dir=${dir}`);

  const clientVendorPath = path.resolve(
    dir,
    `.fusion/dist/development/client/client-legacy-vendor.js`
  );

  const serverMainPath = path.resolve(
    dir,
    `.fusion/dist/development/server/server-main.js`
  );

  t.ok(await exists(clientVendorPath), 'Client vendor file gets compiled');
  t.ok(await exists(serverMainPath), 'Server main file gets compiled');

  const clientVendor = await readFile(clientVendorPath, 'utf8');
  const serverMain = await readFile(serverMainPath, 'utf8');

  babel.transform(clientVendor, {
    plugins: [
      () => {
        return {
          visitor: {
            FunctionDeclaration: path => {
              if (path.node.async) {
                // $FlowFixMe
                t.fail(`bundle has untranspiled async function`);
              }
            },
            ArrowFunctionExpression: path => {
              if (path.node.async) {
                // $FlowFixMe
                t.fail('bundle has untranspiled async function');
              }
            },
            FunctionExpression: path => {
              if (path.node.async) {
                // $FlowFixMe
                t.fail('bundle has untranspiled async function');
              }
            },
          },
        };
      },
    ],
  });

  t.ok(clientVendor.includes(`'fixturepkg_string'`));
  t.equal(serverMain.includes(`'fixturepkg_string'`), false);
  t.ok(
    serverMain.includes(`__SECRET_FILE_LOADER__!./package.json?assetUrl=true`)
  );
}, 100000);
