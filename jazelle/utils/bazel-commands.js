// @flow
const {relative, basename} = require('path');
const {bazel} = require('./binary-paths.js');
const {spawn, read} = require('./node-helpers.js');

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
  await spawn(bazel, ['build', `//${cwd}:${name}`, '--verbose_failures'], {
    stdio,
    env: process.env,
    cwd: root,
  });
};

/*::
export type TestArgs = {
  root: string,
  cwd: string,
  args: Array<string>,
  name?: string,
  stdio?: Stdio,
};
type Test = (TestArgs) => Promise<void>;
*/
const test /*: Test */ = async ({
  root,
  cwd,
  args,
  name = 'test',
  stdio = 'inherit',
}) => {
  cwd = relative(root, cwd);
  const testParams = args.map(arg => `--test_arg=${arg}`);
  await spawn(
    bazel,
    ['test', `//${cwd}:${name}`, '--verbose_failures', ...testParams],
    {
      stdio,
      env: process.env,
      cwd: root,
    }
  ).catch(async e => {
    const path = relative(root, cwd);
    const file = `${root}/bazel-testlogs/${path}/${name}/${name}.log`;
    const log = await read(file, 'utf8');
    e.stack += log;
    throw e;
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
  await spawn(bazel, ['run', `//${cwd}:${name}`, '--verbose_failures'], {
    stdio,
    env: process.env,
    cwd: root,
  });
};

/*::
export type DevArgs = {
  root: string,
  cwd: string,
  stdio?: Stdio,
};
type Dev = (DevArgs) => Promise<void>;
*/
const dev /*: Dev */ = async ({root, cwd, stdio = 'inherit'}) => {
  await run({root, cwd, name: 'dev', stdio});
};

/*::
export type LintArgs = {
  root: string,
  cwd: string,
  stdio?: Stdio,
};
type Lint = (LintArgs) => Promise<void>;
*/
const lint /*: Lint */ = async ({root, cwd, stdio = 'inherit'}) => {
  await run({root, cwd, name: 'lint', stdio});
};

/*::
export type FlowArgs = {
  root: string,
  cwd: string,
  stdio?: Stdio,
};
type Flow = (FlowArgs) => Promise<void>;
*/
const flow /*: Flow */ = async ({root, cwd, stdio = 'inherit'}) => {
  await run({root, cwd, name: 'flow', stdio});
};

/*::
export type StartArgs = {
  root: string,
  cwd: string,
  stdio?: Stdio,
};
type Start = (StartArgs) => Promise<void>;
*/
const start /*: Start */ = async ({root, cwd, stdio = 'inherit'}) => {
  await run({root, cwd, stdio});
};

module.exports = {build, test, run, dev, lint, flow, start};
