/* eslint-env node */

const fs = require('fs');
const path = require('path');
const test = require('tape');
const {promisify} = require('util');
const exec = promisify(require('child_process').exec);
const getPort = require('get-port');

const {Compiler} = require('../../build/compiler');

test('throws if missing src/main.js', t => {
  const envs = ['development'];
  const dir = './test/fixtures/__non_existent__';
  t.throws(() => {
    new Compiler({envs: envs, dir});
  });
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
  t.ok(!fs.existsSync(entry), 'Cleans');

  const watcher = await new Promise((resolve, reject) => {
    const watcher = compiler.start((err, stats) => {
      if (err || stats.hasErrors()) {
        return reject(err || new Error('Compiler stats included errors.'));
      }

      return resolve(watcher);
    });
  });
  watcher.close();

  t.ok(fs.existsSync(entry), 'Entry file gets compiled');

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
  t.ok(!fs.existsSync(entry), 'Cleans');

  const watcher = await new Promise((resolve, reject) => {
    const watcher = compiler.start((err, stats) => {
      if (err || stats.hasErrors()) {
        return reject(err || new Error('Compiler stats included errors.'));
      }

      return resolve(watcher);
    });
  });
  watcher.close();

  t.ok(fs.existsSync(entry), 'Entry file gets compiled');
  t.ok(fs.existsSync(entry + '.map'), 'Source map gets compiled');

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
  try {
    await exec(`node -e "${command}"`, {
      env: Object.assign({}, process.env, {
        NODE_ENV: 'development',
      }),
    });
    t.end();
  } catch (e) {
    t.ifError(e);
    t.end();
  }
});

test('production works', async t => {
  const envs = ['production'];
  const dir = './test/fixtures/noop';
  const entryPath = `.fusion/dist/${envs[0]}/server/server-main.js`;
  const entry = path.resolve(dir, entryPath);

  const compiler = new Compiler({envs, dir});
  await compiler.clean();
  t.ok(!fs.existsSync(entry), 'Cleans');

  const watcher = await new Promise((resolve, reject) => {
    const watcher = compiler.start((err, stats) => {
      if (err || stats.hasErrors()) {
        return reject(err || new Error('Compiler stats included errors.'));
      }

      return resolve(watcher);
    });
  });
  watcher.close();

  t.ok(fs.existsSync(entry), 'Entry file gets compiled');
  t.ok(fs.existsSync(entry + '.map'), 'Source map gets compiled');

  const clientDir = path.resolve(dir, `.fusion/dist/${envs[0]}/client`);
  const assets = fs.readdirSync(clientDir);
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
  try {
    await exec(`node -e "${command}"`, {
      env: Object.assign({}, process.env, {
        NODE_ENV: 'production',
      }),
    });
    t.end();
  } catch (e) {
    t.ifError(e);
    t.end();
  }
});

// TODO(#24): Is this how testing should work?
test('test works', async t => {
  const envs = ['test'];
  const dir = './test/fixtures/noop-test';
  const entryPath = `.fusion/dist/${envs[0]}/server/server-main.js`;
  const entry = path.resolve(dir, entryPath);

  const compiler = new Compiler({envs, dir});
  await compiler.clean();
  t.ok(!fs.existsSync(entry), 'Cleans');

  const watcher = await new Promise((resolve, reject) => {
    const watcher = compiler.start((err, stats) => {
      if (err || stats.hasErrors()) {
        return reject(err || new Error('Compiler stats included errors.'));
      }

      return resolve(watcher);
    });
  });
  watcher.close();

  t.ok(fs.existsSync(entry), 'Entry file gets compiled');
  t.ok(fs.existsSync(entry + '.map'), 'Source map gets compiled');

  const clientDir = `.fusion/dist/${envs[0]}/client`;
  const clientEntry = path.resolve(dir, clientDir, 'client-main.js');
  t.ok(fs.existsSync(clientEntry), 'client .js');
  t.ok(fs.existsSync(clientEntry + '.map'), 'client .map');

  // server test bundle
  const serverCommand = `
    require('${entry}');
    `;
  try {
    const {stdout} = await exec(`node -e "${serverCommand}"`, {
      env: Object.assign({}, process.env, {
        NODE_ENV: 'production',
      }),
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
  } catch (e) {
    t.ifError(e);
  }

  // browser test bundle
  const browserCommand = `
    require('${clientEntry}');
    `;
  try {
    const {stdout} = await exec(`node -e "${browserCommand}"`, {
      env: Object.assign({}, process.env, {
        NODE_ENV: 'production',
      }),
    });
    t.ok(
      !stdout.includes('server test runs'),
      'server test not included in browser test bundle'
    );
    t.ok(
      stdout.includes('client test runs'),
      'client test included in browser test bundle'
    );
    t.ok(
      stdout.includes('universal test runs'),
      'universal test included in browser test bundle'
    );
  } catch (e) {
    t.ifError(e);
  }

  t.end();
});
