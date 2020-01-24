// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const fs = require('fs');
const {promisify} = require('util');

const readdir = promisify(fs.readdir);

const dir = path.resolve(__dirname, './fixture');

const {cmd} = require('../utils.js');

test('`fusion build` strips unused types in dev and correctly tree shakes remaining imports w/ assumeNoImportSideEffects: true', async () => {
  await cmd(`build --dir=${dir}`);

  const distFolder = path.resolve(dir, '.fusion/dist/development/client');
  const clientFiles = await readdir(distFolder);

  clientFiles
    .filter(file => path.extname(file) === '.js')
    .map(file => path.join(distFolder, file))
    .forEach(file => {
      const unusedChecks = [
        // userland
        'UnusedUserlandType',
        'UnusedUserlandOtherType',
        '__FIXTURE_USERLAND_UNUSED__',

        // node modules
        'UnusedDependencyType',
        'UnusedDependencyOtherType',
        '__FIXTURE_DEPENDENCY_UNUSED__',
      ];

      unusedChecks.forEach(name => {
        t.ok(
          !fs.readFileSync(file, 'utf-8').includes(name),
          `should not include unused export in browser: ${name}`
        );
      });
    });
}, 100000);
