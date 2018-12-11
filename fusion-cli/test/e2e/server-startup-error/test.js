// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const fs = require('fs');

const {dev} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

test('`fusion dev` top-level error', async () => {
  const {res, proc} = await dev(`--dir=${dir}`, {
    stdio: ['inherit', 'inherit', 'pipe'],
  });
  t.ok(
    res.includes('server-startup-error'),
    'should respond with server startup error'
  );
  proc.stderr.destroy();
  proc.kill();
}, 100000);

test('`fusion dev` recovering from errors', async () => {
  // $FlowFixMe
  const {res, proc} = await dev(`--dir=${dir}`, {
    stdio: ['inherit', 'inherit', 'pipe'],
  });
  const mainPath = path.join(dir, 'src/main.js');
  let numErrors = 0;
  t.ok(
    res.includes('server-startup-error'),
    'should respond with server startup error'
  );
  const output = [];
  function next() {
    numErrors++;
    if (numErrors === 2) {
      t.ok(
        output.join('').includes('server-startup-error'),
        'should log server startup error'
      );
      proc.stderr.destroy();
      proc.kill();
    } else {
      fs.writeFileSync(mainPath, fs.readFileSync(mainPath));
    }
  }
  proc.stderr.on('data', stderr => {
    output.push(stderr.toString());
    next();
  });
  // Need a wait here before saving otherwise the watcher won't pick up the edited file.
  await new Promise(resolve => setTimeout(resolve, 500));
  fs.writeFileSync(mainPath, fs.readFileSync(mainPath));
}, 100000);
