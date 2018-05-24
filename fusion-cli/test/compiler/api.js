/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const fs = require('fs');
const path = require('path');
const test = require('tape');
const getPort = require('get-port');
const {promisify} = require('util');

const {Compiler} = require('../../build/compiler');
const {run} = require('../run-command');

const exists = promisify(fs.exists);
const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);

test('throws if missing src/main.js', t => {
  const envs = ['development'];
  const dir = './test/fixtures/__non_existent__';
  t.throws(() => {
    new Compiler({envs: envs, dir});
  });
  t.end();
});

test('development/production env globals', async t => {
  const envs = ['development', 'production'];
  const dir = './test/fixtures/noop-test';

  const compiler = new Compiler({envs, dir});
  await compiler.clean();

  for (let i = 0; i < envs.length; i++) {
    const entryPath = `.fusion/dist/${envs[i]}/server/server-main.js`;
    const entry = path.resolve(dir, entryPath);

    const watcher = await new Promise((resolve, reject) => {
      const watcher = compiler.start((err, stats) => {
        if (err || stats.hasErrors()) {
          return reject(err || new Error('Compiler stats included errors.'));
        }

        return resolve(watcher);
      });
    });
    watcher.close();

    // Validate browser globals by file content
    const clientDir = path.resolve(dir, `.fusion/dist/${envs[i]}/client`);
    const assets = await readdir(clientDir);
    const clientEntry = assets.find(a => a.match(/^client-main.*\.js$/));
    const clientEntryPath = path.resolve(
      dir,
      `.fusion/dist/${envs[i]}/client/${clientEntry}`
    );
    const clientContent = await readFile(clientEntryPath, 'utf8');

    const expectedClientBrowser = {
      development: `main __BROWSER__ is ".concat(true)`,
      production: 'main __BROWSER__ is ".concat(!0)',
    };
    t.ok(
      clientContent.includes(expectedClientBrowser[envs[i]]),
      `__BROWSER__ is transpiled to be true in ${envs[i]}`
    );

    const expectedClientNode = {
      development: `main __NODE__ is ".concat(false)`,
      production: 'main __NODE__ is ".concat(!1)',
    };
    t.ok(
      clientContent.includes(expectedClientNode[envs[i]]),
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
    t.ok(
      stdout.includes(
        `main __DEV__ is ${(envs[i] === 'development').toString()}`
      ),
      `the global, __DEV__, is ${(envs[i] === 'development').toString()}`
    );
    t.ok(
      stdout.includes('main __NODE__ is true'),
      'the global, __NODE__, is true'
    );
  }
  t.end();
});

test('test env globals', async t => {
  const envs = ['test'];
  const dir = './test/fixtures/noop-test';

  const entryPath = `.fusion/dist/${envs[0]}/server/server-main.js`;
  const entry = path.resolve(dir, entryPath);
  const compiler = new Compiler({envs, dir});
  await compiler.clean();

  const watcher = await new Promise((resolve, reject) => {
    const watcher = compiler.start((err, stats) => {
      if (err || stats.hasErrors()) {
        return reject(err || new Error('Compiler stats included errors.'));
      }

      return resolve(watcher);
    });
  });
  watcher.close();

  t.ok(await exists(entry), 'Entry file gets compiled');
  t.ok(await exists(entry + '.map'), 'Source map gets compiled');

  const clientDir = `.fusion/dist/${envs[0]}/client`;
  const clientEntry = path.resolve(dir, clientDir, 'client-main.js');
  t.ok(await exists(clientEntry), 'client .js');
  t.ok(await exists(clientEntry + '.map'), 'client .map');

  // server test bundle
  const serverCommand = `
    require('${entry}');
    `;
  // $FlowFixMe
  let {stdout} = await run(['-e', serverCommand], {
    env: Object.assign({}, process.env, {
      NODE_ENV: 'production',
    }),
    stdio: 'pipe',
  });
  t.ok(
    stdout.includes('universal __BROWSER__ is false'),
    'the global, __BROWSER__, is false in universal tests'
  );
  t.ok(
    stdout.includes('universal __DEV__ is false'),
    'the global, __DEV__, is false in universal tests'
  );
  t.ok(
    stdout.includes('universal __NODE__ is true'),
    'the global, __NODE__, is true in universal tests'
  );

  // browser test bundle
  // Disabled due to webpack 4 changes
  // const browserCommand = `require('${clientEntry}');`;
  // const {stdout: browserStdout} = await run(['-e', browserCommand], {
  //   env: Object.assign({}, process.env, {
  //     NODE_ENV: 'production',
  //   }),
  //   stdio: 'inherit',
  // });
  // t.ok(
  //   browserStdout.includes('browser __BROWSER__ is true'),
  //   'the global, __BROWSER__, is true in browser tests'
  // );
  // t.ok(
  //   browserStdout.includes('universal __BROWSER__ is true'),
  //   'the global, __BROWSER__, is true in universal tests'
  // );
  // t.ok(
  //   browserStdout.includes('browser __NODE__ is false'),
  //   'the global, __NODE__, is false in browser tests'
  // );
  // t.ok(
  //   browserStdout.includes('universal __NODE__ is false'),
  //   'the global, __NODE__, is false in universal tests'
  // );

  t.end();
});

test('tests throw if no test files exist', t => {
  const envs = ['test'];
  const dir = './test/fixtures/noop';
  t.throws(() => {
    new Compiler({envs: envs, dir});
  });
  t.end();
});

test('generates error if missing default export', async t => {
  const envs = ['development'];
  const dir = './test/fixtures/empty';
  const entryPath = `.fusion/dist/${envs[0]}/server/server-main.js`;
  const entry = path.resolve(dir, entryPath);

  const compiler = new Compiler({envs, dir});
  await compiler.clean();
  t.notok(await exists(entry), 'Cleans');

  const watcher = await new Promise((resolve, reject) => {
    const watcher = compiler.start((err, stats) => {
      if (err || stats.hasErrors()) {
        return reject(err || new Error('Compiler stats included errors.'));
      }

      return resolve(watcher);
    });
  });
  watcher.close();

  t.ok(await exists(entry), 'Entry file gets compiled');

  // $FlowFixMe
  const app = require(entry);
  t.ok(typeof app.start === 'function', 'Entry has start function');
  app
    .start({port: await getPort()})
    .then(server => {
      server.close();
      t.fail('Should not start server when missing default export');
    })
    .catch(() => t.pass('Should reject when missing default export'))
    .then(t.end);
});

test('dev works', async t => {
  const envs = ['development'];
  const dir = './test/fixtures/noop';
  const entryPath = `.fusion/dist/${envs[0]}/server/server-main.js`;
  const entry = path.resolve(dir, entryPath);

  const compiler = new Compiler({envs, dir});
  await compiler.clean();

  t.notok(await exists(entry), 'Cleans');

  const watcher = await new Promise((resolve, reject) => {
    const watcher = compiler.start((err, stats) => {
      if (err || stats.hasErrors()) {
        return reject(err || new Error('Compiler stats included errors.'));
      }

      return resolve(watcher);
    });
  });
  watcher.close();

  t.ok(await exists(entry), 'Entry file gets compiled');
  t.ok(await exists(entry + '.map'), 'Source map gets compiled');

  const command = `
    const assert = require('assert');
    const app = require('${entry}');
    assert.equal(typeof app.start, 'function', 'Entry has start function');
    (async () => {
      const server = await app.start({port: ${await getPort()}});
      server.close();
    })().catch(e => {
      setImmediate(() => {
        throw e;
      });
    });
    `;
  await run(['-e', command], {
    env: Object.assign({}, process.env, {
      NODE_ENV: 'development',
    }),
    stdio: 'pipe',
  });
  t.end();
});

test('compiles with babel plugin', async t => {
  const envs = ['development'];
  const dir = './test/fixtures/custom-babel';
  const serverEntryPath = path.resolve(
    dir,
    `.fusion/dist/${envs[0]}/server/server-main.js`
  );
  const clientEntryPath = path.resolve(
    dir,
    `.fusion/dist/${envs[0]}/client/client-main.js`
  );

  const compiler = new Compiler({envs, dir});
  await compiler.clean();

  const watcher = await new Promise((resolve, reject) => {
    const watcher = compiler.start((err, stats) => {
      if (err || stats.hasErrors()) {
        return reject(err || new Error('Compiler stats included errors.'));
      }

      return resolve(watcher);
    });
  });
  watcher.close();

  t.ok(await exists(clientEntryPath), 'Client file gets compiled');
  t.ok(await exists(serverEntryPath), 'Server file gets compiled');

  const clientEntry = await readFile(clientEntryPath, 'utf8');
  const serverEntry = await readFile(serverEntryPath, 'utf8');

  t.ok(
    clientEntry.includes('transformed_helloworld_custom_babel'),
    'custom plugin applied in client'
  );
  t.ok(
    serverEntry.includes('transformed_helloworld_custom_babel'),
    'custom plugin applied in server'
  );

  t.end();
});

test('transpiles node_modules', async t => {
  const envs = ['development'];
  const dir = './test/fixtures/transpile-node-modules';
  const clientVendorPath = path.resolve(
    dir,
    `.fusion/dist/${envs[0]}/client/client-vendor.js`
  );

  const compiler = new Compiler({envs, dir});
  await compiler.clean();

  const watcher = await new Promise((resolve, reject) => {
    const watcher = compiler.start((err, stats) => {
      if (err || stats.hasErrors()) {
        return reject(err || new Error('Compiler stats included errors.'));
      }

      return resolve(watcher);
    });
  });
  watcher.close();

  t.ok(await exists(clientVendorPath), 'Client vendor file gets compiled');

  const clientVendor = await readFile(clientVendorPath, 'utf8');

  t.ok(
    clientVendor.includes(`$return('fixturepkg_string')`),
    'async/await is transpiled in fixture node_module'
  );

  t.end();
});

test('production works', async t => {
  const envs = ['production'];
  const dir = './test/fixtures/noop';
  const entryPath = `.fusion/dist/${envs[0]}/server/server-main.js`;
  const entry = path.resolve(dir, entryPath);

  const compiler = new Compiler({envs, dir});
  await compiler.clean();

  t.notok(await exists(entry), 'Cleans');

  const watcher = await new Promise((resolve, reject) => {
    const watcher = compiler.start((err, stats) => {
      if (err || stats.hasErrors()) {
        return reject(err || new Error('Compiler stats included errors.'));
      }

      return resolve(watcher);
    });
  });
  watcher.close();

  t.ok(await exists(entry), 'Entry file gets compiled');
  t.ok(await exists(entry + '.map'), 'Source map gets compiled');

  const clientDir = path.resolve(dir, `.fusion/dist/${envs[0]}/client`);
  const assets = await readdir(clientDir);
  t.ok(assets.find(a => a.match(/^client-main.+\.js$/)), 'main .js');
  t.ok(assets.find(a => a.match(/^client-main.+\.js.map$/)), 'main .map');
  //t.ok(assets.find(a => a.match(/^client-main.+\.js.gz$/)), 'main .gz');
  t.ok(assets.find(a => a.match(/^client-main.+\.js.br$/)), 'main .br');
  t.ok(assets.find(a => a.match(/^client-vendor.+\.js$/)), 'vendor .js');
  t.ok(assets.find(a => a.match(/^client-vendor.+\.js.map$/)), 'vendor .map');
  //t.ok(assets.find(a => a.match(/^client-vendor.+\.js.gz$/)), 'vendor .gz');
  t.ok(assets.find(a => a.match(/^client-vendor.+\.js.br$/)), 'vendor .br');
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
  await run(['-e', command], {
    env: Object.assign({}, process.env, {
      NODE_ENV: 'production',
    }),
    stdio: 'pipe',
  });
  t.end();
});

// TODO(#24): Is this how testing should work?
test('test works', async t => {
  const envs = ['test'];
  const dir = './test/fixtures/noop-test';
  const entryPath = `.fusion/dist/${envs[0]}/server/server-main.js`;
  const entry = path.resolve(dir, entryPath);

  const compiler = new Compiler({envs, dir});
  await compiler.clean();

  t.notok(await exists(entry), 'Cleans');

  const watcher = await new Promise((resolve, reject) => {
    const watcher = compiler.start((err, stats) => {
      if (err || stats.hasErrors()) {
        return reject(err || new Error('Compiler stats included errors.'));
      }

      return resolve(watcher);
    });
  });
  watcher.close();

  t.ok(await exists(entry), 'Entry file gets compiled');
  t.ok(await exists(entry + '.map'), 'Source map gets compiled');

  const clientDir = `.fusion/dist/${envs[0]}/client`;
  const clientEntry = path.resolve(dir, clientDir, 'client-main.js');
  t.ok(await exists(clientEntry), 'client .js');
  t.ok(await exists(clientEntry + '.map'), 'client .map');

  // server test bundle
  const serverCommand = `
    require('${entry}');
    `;
  // $FlowFixMe
  const {stdout} = await run(['-e', serverCommand], {
    env: Object.assign({}, process.env, {
      NODE_ENV: 'production',
    }),
    stdio: 'pipe',
  });
  t.ok(
    stdout.includes('server test runs'),
    'server test included in server test bundle'
  );
  t.ok(
    !stdout.includes('client test runs'),
    'client test not included in server test bundle'
  );
  t.ok(
    stdout.includes('universal test runs'),
    'universal test included in browser test bundle'
  );

  // browser test bundle
  // Disabled due to webpack 4 changes
  // const browserCommand = `
  //   require('${clientEntry}');
  //   `;
  // const {stdout: browserStdout} = await run(['-e', browserCommand], {
  //   env: Object.assign({}, process.env, {
  //     NODE_ENV: 'production',
  //   }),
  //   stdio: 'inherit',
  // });
  // t.ok(
  //   !browserStdout.includes('server test runs'),
  //   'server test not included in browser test bundle'
  // );
  // t.ok(
  //   browserStdout.includes('client test runs'),
  //   'client test included in browser test bundle'
  // );
  // t.ok(
  //   browserStdout.includes('universal test runs'),
  //   'universal test included in browser test bundle'
  // );

  t.end();
});
