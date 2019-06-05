// @flow
const {relative, basename} = require('path');
const {bazel} = require('./binary-paths.js');
const {spawn} = require('./node-helpers.js');

const build = async ({
  root,
  cwd = '',
  name = basename(cwd),
  stdio = 'inherit',
}) => {
  cwd = relative(root, cwd);
  return spawn(bazel, ['build', `//${cwd}:${name}`], {
    stdio,
    env: process.env,
    cwd: root,
  });
};

const test = async ({root, cwd = '', name = 'test', stdio = 'inherit'}) => {
  cwd = relative(root, cwd);
  return spawn(bazel, ['test', `//${cwd}:${name}`], {
    stdio,
    env: process.env,
    cwd: root,
  });
};

const run = async ({
  root,
  cwd = '',
  name = basename(cwd),
  stdio = 'inherit',
}) => {
  cwd = relative(root, cwd);
  return spawn(bazel, ['run', `//${cwd}:${name}`], {
    stdio,
    env: process.env,
    cwd: root,
  });
};

module.exports = {build, test, run};
