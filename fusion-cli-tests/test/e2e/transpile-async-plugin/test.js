// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const fs = require('fs');
const {promisify} = require('util');

const readdir = promisify(fs.readdir);
const exists = promisify(fs.exists);

const babel = require('@babel/core');

const dir = path.resolve(__dirname, './fixture');

const {cmd} = require('../utils.js');

test('`fusion build` transpiles async middleware', async () => {
  const serverEntryPath = path.resolve(
    dir,
    `.fusion/dist/production/server/server-main.js`
  );
  const serverMapPath = path.resolve(
    dir,
    `.fusion/dist/production/server/server-main.js.map`
  );
  await cmd(`build --dir=${dir} --production`);
  const distPath = path.resolve(dir, '.fusion/dist/production/client');
  const clientFiles = await readdir(distPath);
  t.ok(
    clientFiles.some(f => /client-legacy-main-(.*?).js$/.test(f)),
    'includes a versioned client-legacy-main.js file'
  );
  t.ok(
    clientFiles.some(f => /client-legacy-vendor-(.*?).js$/.test(f)),
    'includes a versioned client-legacy-vendor.js file'
  );
  t.ok(await exists(serverEntryPath), 'Server Entry file gets compiled');
  t.ok(
    await exists(serverMapPath),
    'Server Entry file sourcemap gets compiled'
  );

  const legacyFiles = clientFiles.filter(f => /client-legacy/.test(f));
  legacyFiles
    .filter(file => path.extname(file) === '.js')
    .forEach(file => {
      babel.transformFileSync(path.join(distPath, file), {
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
    });
}, 100000);
