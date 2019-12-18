// @flow
const {relative, basename, dirname} = require('path');
const {bazel, node} = require('./binary-paths.js');
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
    ['run', `//${cwd}:${name}`, '--verbose_failures', ...testParams],
    {
      stdio,
      env: process.env,
      cwd: root,
    }
  );
};

/*::
export type RunArgs = {
  root: string,
  cwd: string,
  args: Array<string>,
  name?: string,
  stdio?: Stdio,
};
type Run = (RunArgs) => Promise<void>;
*/
const run /*: Run */ = async ({
  root,
  cwd,
  args,
  name = basename(cwd),
  stdio = 'inherit',
}) => {
  cwd = relative(root, cwd);
  const runParams = args.length > 0 ? ['--', ...args] : [];
  await spawn(
    bazel,
    ['run', `//${cwd}:${name}`, '--verbose_failures', ...runParams],
    {
      stdio,
      env: process.env,
      cwd: root,
    }
  );
};

/*::
export type DevArgs = {
  root: string,
  cwd: string,
  args: Array<string>,
  stdio?: Stdio,
};
type Dev = (DevArgs) => Promise<void>;
*/
const dev /*: Dev */ = async ({root, cwd, args, stdio = 'inherit'}) => {
  await run({root, cwd, args, name: 'dev', stdio});
};

/*::
export type LintArgs = {
  root: string,
  cwd: string,
  args: Array<string>,
  stdio?: Stdio,
};
type Lint = (LintArgs) => Promise<void>;
*/
const lint /*: Lint */ = async ({root, cwd, args, stdio = 'inherit'}) => {
  await run({root, cwd, args, name: 'lint', stdio});
};

/*::
export type FlowArgs = {
  root: string,
  cwd: string,
  args: Array<string>,
  stdio?: Stdio,
};
type Flow = (FlowArgs) => Promise<void>;
*/
const flow /*: Flow */ = async ({root, cwd, args, stdio = 'inherit'}) => {
  await run({root, cwd, args, name: 'flow', stdio});
};

/*::
export type StartArgs = {
  root: string,
  cwd: string,
  args: Array<string>,
  stdio?: Stdio,
};
type Start = (StartArgs) => Promise<void>;
*/
const start /*: Start */ = async ({root, cwd, args, stdio = 'inherit'}) => {
  await run({root, cwd, args, stdio});
};

/*::
export type ExecArgs = {
  root: string,
  cwd: string,
  args: Array<string>,
  stdio?: Stdio,
}
export type Exec = (ExecArgs) => Promise<void>;
*/
const exec /*: Exec */ = async ({root, cwd, args, stdio = 'inherit'}) => {
  const [command, ...params] = args;
  const path = process.env.PATH || '';
  const bazelDir = dirname(bazel);
  const nodeDir = dirname(node);
  const env = {PATH: `${bazelDir}:${nodeDir}:${path}:${cwd}/node_modules/.bin`};
  await spawn(command, params, {cwd, env, stdio});
};

module.exports = {build, test, lint, flow, dev, start, run, exec};
