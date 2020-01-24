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

  t.ok(await exists(clientVendorPath), 'Client vendor file gets compiled');

  const clientVendor = await readFile(clientVendorPath, 'utf8');

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
}, 100000);
