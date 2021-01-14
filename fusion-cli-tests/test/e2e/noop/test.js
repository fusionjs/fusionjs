// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const {promisify} = require('util');
const fs = require('fs');
const getPort = require('get-port');
const getHandler = require('fusion-cli/serverless.js');
const http = require('http');
const request = require('axios');

const puppeteer = require('puppeteer');

const readdir = promisify(fs.readdir);
const exists = promisify(fs.exists);

const {cmd, dev, run, start} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

jest.setTimeout(20000);

test('`fusion dev --dir` works w/ relative dir', async () => {
  const entryPath = `.fusion/dist/development/server/server-main.js`;
  const entry = path.resolve(dir, entryPath);

  // $FlowFixMe
  const {proc} = await dev(`--dir=${dir}`, {
    stdio: ['inherit', 'inherit', 'pipe'],
  });
  await new Promise(resolve => setTimeout(resolve, 1000));
  t.ok(await exists(entry), 'Entry file gets compiled');
  proc.stderr.destroy(); // disconnect the piped socket to prevent the Node process from hanging
  proc.kill('SIGKILL');
}, 100000);

test('`fusion dev` works', async () => {
  const entryPath = `.fusion/dist/development/server/server-main.js`;
  const entry = path.resolve(dir, entryPath);

  const {proc, port} = await dev(`--dir=${dir}`);
  const resp = await request(`http://localhost:${port}/_static/client-main.js`);
  expect(resp.data.includes(`longVariableNameForElement`)).toEqual(true);
  t.ok(await exists(entry), 'Entry file gets compiled');
  proc.kill('SIGKILL');
});

test('`fusion build` works', async () => {
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
  const clientMainVendorMap = path.resolve(
    dir,
    `.fusion/dist/development/client/client-vendor.js.map`
  );
  await cmd(`build --dir=${dir}`);
  t.ok(await exists(serverEntryPath), 'Server Entry file gets compiled');
  t.ok(
    await exists(serverMapPath),
    'Server Entry file sourcemap gets compiled'
  );
  t.ok(await exists(clientMain), 'Client Entry file gets compiled');
  t.ok(
    await exists(clientMainMap),
    'Client Entry file sourcemap gets compiled'
  );
  t.ok(await exists(clientMainVendor), 'Client vendor file gets compiled');
  t.ok(
    await exists(clientMainVendorMap),
    'Client vendor file sourcemap gets compiled'
  );
}, 100000);

test('`fusion build --experimentalServerless` works', async () => {
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
  const clientMainVendorMap = path.resolve(
    dir,
    `.fusion/dist/development/client/client-vendor.js.map`
  );
  await cmd(`build --dir=${dir} --experimentalServerless`);
  t.ok(await exists(serverEntryPath), 'Server Entry file gets compiled');
  t.ok(
    await exists(serverMapPath),
    'Server Entry file sourcemap gets compiled'
  );
  t.ok(await exists(clientMain), 'Client Entry file gets compiled');
  t.ok(
    await exists(clientMainMap),
    'Client Entry file sourcemap gets compiled'
  );
  t.ok(await exists(clientMainVendor), 'Client vendor file gets compiled');
  t.ok(
    await exists(clientMainVendorMap),
    'Client vendor file sourcemap gets compiled'
  );
  const handler = getHandler({env: 'development', dir});
  t.equal(
    typeof handler,
    'function',
    'serverless build exposes a handler function'
  );
  const port = await getPort();
  const server = http.createServer((req, res) => {
    handler(req, res);
  });
  await new Promise((resolve, reject) => {
    server.listen(port, err => {
      if (err) reject(err);
      resolve();
    });
  });
  const response = await request(
    `http://localhost:${port}/_static/client-main.js`
  );
  const renderResponse = await request(`http://localhost:${port}/`, {
    headers: {
      accept: 'text/html',
    },
  });
  t.ok(response.data);
  t.ok(renderResponse.data);
  server.close();
}, 100000);

test('`fusion build --experimentalServerless --production` works', async () => {
  const serverEntryPath = path.resolve(
    dir,
    `.fusion/dist/production/server/server-main.js`
  );
  const serverMapPath = path.resolve(
    dir,
    `.fusion/dist/production/server/server-main.js.map`
  );
  await cmd(`build --dir=${dir} --experimentalServerless --production`, {
    env: {...process.env, NODE_ENV: 'production'},
  });
  t.ok(await exists(serverEntryPath), 'Server Entry file gets compiled');
  t.ok(
    await exists(serverMapPath),
    'Server Entry file sourcemap gets compiled'
  );
  const oldEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  const handler = getHandler({env: 'production', dir});
  t.equal(
    typeof handler,
    'function',
    'serverless build exposes a handler function'
  );
  const port = await getPort();
  const server = http.createServer((req, res) => {
    handler(req, res);
  });
  await new Promise((resolve, reject) => {
    server.listen(port, err => {
      if (err) reject(err);
      resolve();
    });
  });
  const renderResponse = await request(`http://localhost:${port}/`, {
    headers: {
      accept: 'text/html',
    },
  });
  t.ok(renderResponse.data);
  server.close();
  process.env.NODE_ENV = oldEnv;
}, 100000);

test('`fusion build` works in production with a CDN_URL', async () => {
  const serverEntryPath = path.resolve(
    dir,
    `.fusion/dist/production/server/server-main.js`
  );
  const serverMapPath = path.resolve(
    dir,
    `.fusion/dist/production/server/server-main.js.map`
  );
  await cmd(`build --dir=${dir} --production`);
  const clientFiles = await readdir(
    path.resolve(dir, '.fusion/dist/production/client')
  );
  t.ok(
    clientFiles.some(f => /client-main-(.*?).js$/.test(f)),
    'includes a versioned client-main.js file'
  );
  t.ok(
    clientFiles.some(f => /client-vendor-(.*?).js$/.test(f)),
    'includes a versioned client-vendor.js file'
  );
  t.ok(await exists(serverEntryPath), 'Server Entry file gets compiled');
  t.ok(
    await exists(serverMapPath),
    'Server Entry file sourcemap gets compiled'
  );
  const {res, proc} = await start(`--dir=${dir}`, {
    env: Object.assign({}, process.env, {
      CDN_URL: 'https://cdn.com/test',
      NODE_ENV: 'production',
    }),
  });

  t.ok(
    res.includes('https://cdn.com/test/client-legacy-main'),
    'includes a reference to client-legacy-main'
  );
  t.ok(
    res.includes('https://cdn.com/test/client-legacy-vendor'),
    'includes a reference to client-legacy-vendor'
  );
  proc.kill('SIGKILL');
}, 100000);

test('`fusion build` works in production with default asset path and supplied ROUTE_PREFIX', async () => {
  const serverEntryPath = path.resolve(
    dir,
    `.fusion/dist/production/server/server-main.js`
  );
  const serverMapPath = path.resolve(
    dir,
    `.fusion/dist/production/server/server-main.js.map`
  );
  await cmd(`build --dir=${dir} --production`);
  const clientFiles = await readdir(
    path.resolve(dir, '.fusion/dist/production/client')
  );
  t.ok(
    clientFiles.some(f => /client-main-(.*?).js$/.test(f)),
    'includes a versioned client-main.js file'
  );
  t.ok(
    clientFiles.some(f => /client-vendor-(.*?).js$/.test(f)),
    'includes a versioned client-vendor.js file'
  );
  t.ok(await exists(serverEntryPath), 'Server Entry file gets compiled');
  t.ok(
    await exists(serverMapPath),
    'Server Entry file sourcemap gets compiled'
  );
  const {res, proc} = await start(`--dir=${dir}`, {
    env: Object.assign({}, process.env, {
      ROUTE_PREFIX: '/test-prefix',
      NODE_ENV: 'production',
    }),
  });
  t.ok(
    res.includes('/test-prefix/_static/client-legacy-main'),
    'includes a reference to client-legacy-main'
  );
  t.ok(
    res.includes('/test-prefix/_static/client-legacy-vendor'),
    'includes a reference to client-legacy-vendor'
  );
  proc.kill('SIGKILL');
}, 100000);

test('`fusion start` does not throw error on client when using route prefix', async () => {
  await cmd(`build --dir=${dir} --production`);
  const {proc, port} = await start(`--dir=${dir}`, {
    env: Object.assign({}, process.env, {
      ROUTE_PREFIX: '/test-prefix',
      NODE_ENV: 'production',
    }),
  });

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  page.on('error', err => {
    // $FlowFixMe
    t.fail(`Client-side error: ${err}`);
  });

  page.on('pageerror', err => {
    // $FlowFixMe
    t.fail(`Client-side error: ${err}`);
  });

  await page.goto(`http://localhost:${port}/test-prefix/`, {
    waitUntil: 'networkidle0',
  });

  t.ok('did not error');
  browser.close();
  proc.kill('SIGKILL');
}, 100000);

test('`fusion build` works in production', async () => {
  const serverEntryPath = path.resolve(
    dir,
    `.fusion/dist/production/server/server-main.js`
  );
  const serverMapPath = path.resolve(
    dir,
    `.fusion/dist/production/server/server-main.js.map`
  );
  await cmd(`build --dir=${dir} --production`);
  const clientFiles = await readdir(
    path.resolve(dir, '.fusion/dist/production/client')
  );
  t.ok(
    clientFiles.some(f => /client-main-(.*?).js$/.test(f)),
    'includes a versioned client-main.js file'
  );
  t.ok(
    clientFiles.some(f => /client-vendor-(.*?).js$/.test(f)),
    'includes a versioned client-vendor.js file'
  );
  t.ok(await exists(serverEntryPath), 'Server Entry file gets compiled');
  t.ok(
    await exists(serverMapPath),
    'Server Entry file sourcemap gets compiled'
  );
  const {res, proc} = await start(`--dir=${dir}`, {
    env: Object.assign({}, process.env, {
      NODE_ENV: 'production',
    }),
  });
  t.ok(
    res.includes('/_static/client-legacy-main'),
    'includes a reference to client-legacy-main'
  );
  t.ok(
    res.includes('/_static/client-legacy-vendor'),
    'includes a reference to client-legacy-vendor'
  );

  clientFiles.forEach(file => {
    if (file.endsWith('.map')) {
      t.ok(
        clientFiles.includes(path.basename(file, '.map')),
        'source map filename has same base as regular file'
      );
    }
  });
  proc.kill('SIGKILL');
}, 100000);

test('production works', async () => {
  await cmd(`build --dir=${dir} --production`, {
    env: {...process.env, NODE_ENV: 'production'},
  });

  const entryPath = `.fusion/dist/production/server/server-main.js`;
  const entry = path.resolve(dir, entryPath);

  t.ok(await exists(entry), 'Entry file gets compiled');
  t.ok(await exists(entry + '.map'), 'Source map gets compiled');

  const clientDir = path.resolve(dir, `.fusion/dist/production/client`);
  const assets = await readdir(clientDir);
  t.ok(
    assets.find(a => a.match(/^client-main.+\.js$/)),
    'main .js'
  );
  t.ok(
    assets.find(a => a.match(/^client-main.+\.js.map$/)),
    'main .map'
  );
  //t.ok(assets.find(a => a.match(/^client-main.+\.js.gz$/)), 'main .gz');
  t.ok(
    assets.find(a => a.match(/^client-main.+\.js.br$/)),
    'main .br'
  );
  t.ok(
    assets.find(a => a.match(/^client-vendor.+\.js$/)),
    'vendor .js'
  );
  t.ok(
    assets.find(a => a.match(/^client-vendor.+\.js.map$/)),
    'vendor .map'
  );
  //t.ok(assets.find(a => a.match(/^client-vendor.+\.js.gz$/)), 'vendor .gz');
  t.ok(
    assets.find(a => a.match(/^client-vendor.+\.js.br$/)),
    'vendor .br'
  );
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
}, 100000);

test('dev works', async () => {
  await cmd(`build --dir=${dir}`, {
    env: {...process.env, NODE_ENV: 'development'},
  });

  const entryPath = `.fusion/dist/development/server/server-main.js`;
  const entry = path.resolve(dir, entryPath);

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
}, 100000);
