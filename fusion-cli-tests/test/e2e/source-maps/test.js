// @flow
/* eslint-env node */

const t = require('assert');
const fs = require('fs');
const path = require('path');
const request = require('request-promise');

const {cmd, start} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

test('source maps are served when DANGEROUSLY_EXPOSE_SOURCE_MAPS=true', async () => {
  const env = {
    ...process.env,
    NODE_ENV: 'production',
    DANGEROUSLY_EXPOSE_SOURCE_MAPS: true,
  };
  await cmd(`build --dir=${dir} --production`, {env});

  const {proc, port} = await start(`--dir=${dir}`, {env});

  const files = fs.readdirSync(
    path.join(dir, '.fusion/dist/production/client')
  );
  const bundles = files.filter(file => path.extname(file) === '.js');
  const sourceMaps = files.filter(file => file.endsWith('.js.map'));
  const withMap = bundles.filter(isWithMap);

  t.ok(bundles.length > 0, 'build succeeded');
  t.ok(withMap.length > 0, 'build produces with-map bundles');
  t.equal(
    withMap.length * 2,
    bundles.length,
    'build produces one with-map bundle for each regular bundle'
  );

  t.ok(
    bundles.every(
      bundle => isWithMap(bundle) || sourceMaps.includes(`${bundle}.map`)
    ),
    'build produces one source map for each regular bundle'
  );

  for (const bundle of bundles) {
    const jsPath = `/_static/${bundle}`;
    const mapPath = `${jsPath}.map`;

    const asset = await request(`http://localhost:${port}${jsPath}`, {
      resolveWithFullResponse: true,
      simple: false,
    });
    t.equal(asset.statusCode, 200, 'Request for JS bundle yields OK response');
    if (isWithMap(bundle)) {
      t.ok(
        containsSourceMapComment(asset.body),
        'bundle contains source map comment'
      );
    } else {
      t.ok(
        !containsSourceMapComment(asset.body),
        'bundle does not contain source map comment'
      );
    }

    const assetMap = await request(`http://localhost:${port}${mapPath}`, {
      resolveWithFullResponse: true,
      simple: false,
    });
    if (isWithMap(bundle)) {
      t.equal(
        assetMap.statusCode,
        404,
        'Request for associated source map 404s for with-map bundles'
      );
      t.equal(assetMap.body, 'Not Found');
    } else {
      t.equal(
        assetMap.statusCode,
        200,
        'Request for associated source map yield OK for regular bundles'
      );
    }
  }

  const index = await request(`http://localhost:${port}`, {
    headers: {
      Accept: 'text/html',
    },
  });
  // Use regex over puppeteer for speed
  const re = /<script .*?src="(.*?)".*?>/g;
  let match;
  let scriptCount = 0;
  do {
    match = re.exec(index);
    if (match) {
      scriptCount++;
      t.ok(isWithMap(match[1]), 'Critical chunks are -with-map bundles');
    }
  } while (match);
  t.equal(scriptCount, 3, 'All critical chunks are `-with-map` bundles');

  const assetPath = await request(`http://localhost:${port}/asset-url`, {
    headers: {
      Accept: 'text/html',
    },
  });
  const asset = await request(`http://localhost:${port}${assetPath}`, {
    resolveWithFullResponse: true,
    simple: false,
  });
  t.equal(asset.statusCode, 200, 'Request for sourcemap via assetUrl works');

  proc.kill('SIGKILL');
}, 100000);

test('source maps are produced but hidden in production', async () => {
  const env = {
    ...process.env,
    NODE_ENV: 'production',
  };
  await cmd(`build --dir=${dir} --production`, {env});

  const {proc, port} = await start(`--dir=${dir}`, {env});

  const files = fs.readdirSync(
    path.join(dir, '.fusion/dist/production/client')
  );
  const bundles = files.filter(file => path.extname(file) === '.js');
  const sourceMaps = files.filter(file => file.endsWith('.js.map'));
  const withMap = bundles.filter(isWithMap);

  t.ok(bundles.length > 0, 'build succeeded');
  t.ok(withMap.length > 0, 'build produces with-map bundles');
  t.equal(
    withMap.length * 2,
    bundles.length,
    'build produces one with-map bundle for each regular bundle'
  );

  t.ok(
    bundles.every(
      bundle => isWithMap(bundle) || sourceMaps.includes(`${bundle}.map`)
    ),
    'build produces one source map for each regular bundle'
  );

  for (const bundle of bundles) {
    const jsPath = `/_static/${bundle}`;
    const mapPath = `${jsPath}.map`;

    const asset = await request(`http://localhost:${port}${jsPath}`, {
      resolveWithFullResponse: true,
      simple: false,
    });
    t.equal(asset.statusCode, 200, 'Request for JS bundle yields OK response');
    if (isWithMap(bundle)) {
      t.ok(
        containsSourceMapComment(asset.body),
        'bundle contains source map comment'
      );
    } else {
      t.ok(
        !containsSourceMapComment(asset.body),
        'bundle does not contain source map comment'
      );
    }

    const assetMap = await request(`http://localhost:${port}${mapPath}`, {
      resolveWithFullResponse: true,
      simple: false,
    });
    t.equal(
      assetMap.statusCode,
      404,
      'Request for associated source map 404s for all source maps'
    );
    t.equal(assetMap.body, 'Not Found');
  }

  const index = await request(`http://localhost:${port}`, {
    headers: {
      Accept: 'text/html',
    },
  });
  // Use regex over puppeteer for speed
  const re = /<script .*?src="(.*?)".*?>/g;
  let match;
  let scriptCount = 0;
  do {
    match = re.exec(index);
    if (match) {
      scriptCount++;
      t.ok(!isWithMap(match[1]), 'Critical chunks are not -with-map bundles');
    }
  } while (match);
  t.equal(scriptCount, 3, 'All critical chunks are not `-with-map` bundles');

  const assetPath = await request(`http://localhost:${port}/asset-url`, {
    headers: {
      Accept: 'text/html',
    },
  });
  const asset = await request(`http://localhost:${port}${assetPath}`, {
    resolveWithFullResponse: true,
    simple: false,
  });
  t.equal(asset.statusCode, 200, 'Request for sourcemap via assetUrl works');

  proc.kill('SIGKILL');
}, 100000);

test('source maps are not served when CDN_URL is set', async () => {
  const cdnUrl = 'http://this-is-a-cdn.biz';
  const env = {
    ...process.env,
    NODE_ENV: 'production',
    DANGEROUSLY_EXPOSE_SOURCE_MAPS: true,
    CDN_URL: cdnUrl,
    PORT: 4999,
  };
  await cmd(`build --dir=${dir} --production`, {env});

  const {proc, port} = await start(`--dir=${dir}`, {env});

  const files = fs.readdirSync(
    path.join(dir, '.fusion/dist/production/client')
  );
  const bundles = files.filter(file => path.extname(file) === '.js');
  const sourceMaps = files.filter(file => file.endsWith('.js.map'));
  const withMap = bundles.filter(isWithMap);

  t.ok(bundles.length > 0, 'build succeeded');
  t.ok(withMap.length > 0, 'build produces with-map bundles');
  t.equal(
    withMap.length * 2,
    bundles.length,
    'build produces one with-map bundle for each regular bundle'
  );

  t.ok(
    bundles.every(
      bundle => isWithMap(bundle) || sourceMaps.includes(`${bundle}.map`)
    ),
    'build produces one source map for each regular bundle'
  );

  for (const bundle of bundles) {
    const jsPath = `/_static/${bundle}`;
    const mapPath = `${jsPath}.map`;

    const asset = await request(`http://localhost:${port}${jsPath}`, {
      resolveWithFullResponse: true,
      simple: false,
    });
    t.equal(asset.statusCode, 200, 'Request for JS bundle yields OK response');
    if (isWithMap(bundle)) {
      t.ok(
        containsSourceMapComment(asset.body),
        'bundle contains source map comment'
      );
    } else {
      t.ok(
        !containsSourceMapComment(asset.body),
        'bundle does not contain source map comment'
      );
    }

    const assetMap = await request(`http://localhost:${port}${mapPath}`, {
      resolveWithFullResponse: true,
      simple: false,
    });
    if (isWithMap(bundle)) {
      t.equal(
        assetMap.statusCode,
        404,
        'Request for associated source map 404s for with-map bundles'
      );
      t.equal(assetMap.body, 'Not Found');
    } else {
      t.equal(
        assetMap.statusCode,
        200,
        'Request for associated source map yield OK for regular bundles'
      );
    }
  }

  const index = await request(`http://localhost:${port}`, {
    headers: {
      Accept: 'text/html',
    },
  });
  // Use regex over puppeteer for speed
  const re = /<script .*?src="(.*?)".*?>/g;
  let match;
  let scriptCount = 0;
  do {
    match = re.exec(index);
    if (match) {
      scriptCount++;
      const scriptSrc = match[1];
      t.ok(isWithMap(scriptSrc), 'Critical chunks are -with-map bundles');
      t.ok(
        !scriptSrc.includes(cdnUrl),
        'CDN_URL is not used when DANGEROUSLY_EXPOSE_SOURCE_MAPS=true'
      );
    }
  } while (match);
  t.equal(scriptCount, 3, 'All critical chunks are `-with-map` bundles');

  const assetPath = await request(`http://localhost:${port}/asset-url`, {
    headers: {
      Accept: 'text/html',
    },
  });
  t.equal(assetPath, '/_static/d41d8cd98f00b204e9800998ecf8427e.map');

  proc.kill('SIGKILL');
}, 100000);

function isWithMap(bundle) {
  return bundle.endsWith('-with-map.js');
}

function containsSourceMapComment(file) {
  return file.includes('//# sourceMappingURL=');
}
