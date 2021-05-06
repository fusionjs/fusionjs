// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const fs = require('fs');
const {promisify} = require('util');
const acorn = require('acorn');

const readdir = promisify(fs.readdir);

const dir = path.resolve(__dirname, './fixture');

const {cmd} = require('../utils.js');

test('`fusion build` legacy bundle contains valid es5 code', async () => {
  await cmd(`build --dir=${dir} --production`);

  const clientDistPath = path.resolve(dir, '.fusion/dist/production/client');
  const legacyFiles = (await readdir(clientDistPath)).filter(
    f => /client-legacy/.test(f) && path.extname(f) === '.js'
  );

  t.ok(legacyFiles.length > 0, 'produced legacy bundle');

  legacyFiles.forEach(file => {
    const filePath = path.join(clientDistPath, file);
    const code = fs.readFileSync(filePath, 'utf-8');

    try {
      acorn.parse(code, {
        ecmaVersion: 5,
      });
    } catch (e) {
      // $FlowFixMe
      t.fail(
        [
          'Failed to parse legacy bundle using es5 syntax. Error was:',
          e,
          `@ ${filePath}:${e.loc.line}:${e.loc.column}`,
        ].join('\n')
      );
    }
  });
}, 35000);
