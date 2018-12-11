// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const fs = require('fs');

const {cmd} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

test('`fusion build` compresses assets for production', async () => {
  await cmd(`build --dir=${dir} --production`);

  const fusion_folder = '.fusion/dist/production/client/';
  fs.readdir(path.resolve(dir, fusion_folder), (err, files) => {
    if (err) throw err;
    t.ok(files.some(file => path.extname(file) === '.gz'), 'gzip works');
    t.ok(files.some(file => path.extname(file) === '.br'), 'brotli works');
    t.ok(
      files.some(
        file =>
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
}, 100000);
