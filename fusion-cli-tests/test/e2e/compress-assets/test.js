// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const fs = require('fs');

const {cmd} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');
const dir2 = path.resolve(__dirname, './fixture2');
const dir3 = path.resolve(__dirname, './fixture3');

test('`fusion build` compresses assets for production', async () => {
  await cmd(`build --dir=${dir} --production`);
  await cmd(`build --dir=${dir2} --production`);
  await cmd(`build --dir=${dir3} --production`);

  const fusion_folder = '.fusion/dist/production/client/';
  fs.readdir(path.resolve(dir, fusion_folder), (err, files) => {
    if (err) throw err;
    t.ok(
      files.some((file) => path.extname(file) === '.gz'),
      'gzip=true zips assets'
    );
    t.ok(
      files.some((file) => path.extname(file) === '.br'),
      'brotli=true zips assets'
    );
    t.ok(
      files.some(
        (file) =>
          path.extname(file) === '.svg' &&
          fs.statSync(path.resolve(dir, fusion_folder, file)).size <
            fs.statSync(path.resolve(dir, 'src/assets/SVG_logo.svg')).size
      ),
      'svg works'
    );
    t.ok(
      fs
        .readFileSync(path.resolve(dir, 'src/assets/SVG_logo.svg'), 'utf8')
        .includes('shouldNotBeRemoved')
    );
  });

  fs.readdir(path.resolve(dir2, fusion_folder), (err, files) => {
    if (err) throw err;
    t.ok(
      !files.some((file) => path.extname(file) === '.gz'),
      'gzip=false prevents zipping assets'
    );
    t.ok(
      !files.some((file) => path.extname(file) === '.br'),
      'brotli=false prevents zipping assets'
    );
  });

  fs.readdir(path.resolve(dir3, fusion_folder), (err, files) => {
    if (err) throw err;
    t.ok(
      !files.some((file) => path.extname(file) === '.gz'),
      'zopfli=false prevents zipping assets'
    );
  });
}, 100000);
