// @flow
const {relative, basename} = require('path');
const {bazel} = require('./binary-paths.js');
const {spawn} = require('./node-helpers.js');

/*::
import type {Stdio} from './node-helpers.js';

export type BuildArgs = {
  root: string,
  cwd: string,
  name?: string,
  stdio?: Stdio,
};
export type Build = (BuildArgs) => Promise<void>;
*/
const build /*: Build */ = async ({
  root,
  cwd,
  name = basename(cwd),
  stdio = 'inherit',
}) => {
  cwd = relative(root, cwd);
  await spawn(bazel, ['build', `//${cwd}:${name}`], {
    stdio,
    env: process.env,
    cwd: root,
  });
};

/*::
export type TestArgs = {
  root: string,
  cwd: string,
  name?: string,
  stdio?: Stdio,
};
type Test = (TestArgs) => Promise<void>;
*/
const test /*: Test */ = async ({
  root,
  cwd,
  name = 'test',
  stdio = 'inherit',
}) => {
  cwd = relative(root, cwd);
  await spawn(bazel, ['test', `//${cwd}:${name}`], {
    stdio,
    env: process.env,
    cwd: root,
  });
};

/*::
export type RunArgs = {
  root: string,
  cwd: string,
  name?: string,
  stdio?: Stdio,
};
type Run = (RunArgs) => Promise<void>;
*/
const run /*: Run */ = async ({
  root,
  cwd,
  name = basename(cwd),
  stdio = 'inherit',
}) => {
  cwd = relative(root, cwd);
  await spawn(bazel, ['run', `//${cwd}:${name}`], {
    stdio,
    env: process.env,
    cwd: root,
  });
};

module.exports = {build, test, run};
