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
    t.ok(
      files.includes('54dcbe888c1b1145462ae09d6610ab82.txt'),
      'has server asset'
    );
    t.ok(
      files.includes('2642b2c23331388417654062a7058f82.txt'),
      'has universal asset'
    );
  });
}, 100000);
