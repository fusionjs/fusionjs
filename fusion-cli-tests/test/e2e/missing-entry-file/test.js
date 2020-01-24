// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');

const dir = path.resolve(__dirname, './fixture');

const {cmd} = require('../utils.js');

test('throws if missing src/main.js', async () => {
  try {
    await cmd(`build --dir=${dir}`, {stdio: 'pipe'});
    // $FlowFixMe
    t.fail('did not error');
  } catch (e) {
    t.ok(
      e.stderr.includes('Project directory must contain a src/main.js file')
    );
  }
});
