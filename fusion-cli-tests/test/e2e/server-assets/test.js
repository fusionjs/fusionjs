// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const fs = require('fs');

const {cmd} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

test('`fusion build` puts server assets in client directory', async () => {
  await cmd(`build --dir=${dir} --production`);

  const fusion_folder = '.fusion/dist/production/client/';
  fs.readdir(path.resolve(dir, fusion_folder), (err, files) => {
    t.ok(files.includes('00013199171891e8.txt'), 'has server asset');
    t.ok(files.includes('acc67e892a3932e1.txt'), 'has universal asset');
  });
}, 100000);
