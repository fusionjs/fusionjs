// @flow
/* eslint-env node */

const fs = require('fs');
const path = require('path');

const {cmd} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

test('`fusion build` with assets', async () => {
  await cmd(`build --dir=${dir} --production --skipSourceMaps`);

  const serverBuild = fs.readdirSync(
    path.join(dir, '.fusion/dist/production/server')
  );
  expect(serverBuild.length > 0).toBe(true);
  expect(serverBuild.filter(file => file.endsWith('.js.map'))).toEqual([]);

  const clientBuild = fs.readdirSync(
    path.join(dir, '.fusion/dist/production/client')
  );
  expect(clientBuild.length > 0).toBe(true);
  expect(clientBuild.filter(file => file.endsWith('.js.map'))).toEqual([]);
}, 100000);
