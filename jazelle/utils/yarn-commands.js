// @flow
const {dirname} = require('path');
const {checksumCache} = require('./checksum-cache.js');
const {getDownstreams} = require('./get-downstreams.js');
const {spawn} = require('./node-helpers.js');
const {bazel, node, yarn} = require('./binary-paths.js');

const errorsOnly = ['ignore', 'ignore', 'inherit'];

const batchBuild = async ({root, deps, self, stdio}) => {
  const others = deps.slice(0, -1);
  const main = deps.slice(-1).pop();

  const depths = {};
  for (const dep of others) {
    if (!depths[dep.depth]) depths[dep.depth] = [];
    depths[dep.depth].push(dep);
  }
  // loops in order of insertion (i.e. higher depths first)
  for (const depth in depths) {
    await Promise.all(
      depths[depth].map(async dep => {
        if (dep.meta.scripts && dep.meta.scripts.build) {
          await buildCacheable({root, dep, deps, stdio});
        }
      })
    );
  }
  if (self) await buildCacheable({root, dep: main, deps, stdio});
};
const buildCacheable = async ({root, dep, deps, stdio}) => {
  const {dir, meta} = dep;
  const cache = await checksumCache(root);
  if (!(await cache.isCached(dir))) {
    console.log(`Building ${meta.name}`);
    await spawn(node, [yarn, 'build'], {stdio, env: process.env, cwd: dir});

    getDownstreams(deps, dep).forEach(d => {
      // check depth to ensure we only invalidate downstreams, not cyclical deps
      if (dep.depth < d.depth) cache.invalidate(d.dir);
    });
    await cache.update(dir);
    await cache.save();
  }
};

/*::
import type {Metadata} from './get-local-dependencies.js';
import type {Stdio} from './node-helpers.js';
export type BuildArgs = {
  root: string,
  deps: Array<Metadata>,
  stdio?: Stdio,
};
export type Build = (BuildArgs) => Promise<void>;
*/
const build /*: Build */ = async ({root, deps, stdio = errorsOnly}) => {
  await batchBuild({root, deps, self: true, stdio}); // allow non-ignore stdio here so we can test
};

/*::
export type DevArgs = {
  root: string,
  deps: Array<Metadata>,
  args: Array<string>,
  stdio?: Stdio,
};
export type Dev = (DevArgs) => Promise<void>;
*/
const dev /*: Dev */ = async ({root, deps, args, stdio = 'inherit'}) => {
  const main = deps.slice(-1).pop();
  await batchBuild({root, deps, self: false, stdio: errorsOnly});
  await spawn(node, [yarn, 'dev', ...args], {
    stdio,
    env: process.env,
    cwd: main.dir,
  });
};

/*::
export type TestArgs = {
  root: string,
  deps: Array<Metadata>,
  args: Array<string>,
  stdio?: Stdio,
};
export type Test = (TestArgs) => Promise<void>;
*/
const test /*: Test */ = async ({root, deps, args, stdio = 'inherit'}) => {
  const main = deps.slice(-1).pop();
  await batchBuild({root, deps, self: false, stdio: errorsOnly});
  await spawn(node, [yarn, 'test', ...args], {
    stdio,
    env: process.env,
    cwd: main.dir,
  });
};

/*::
export type LintArgs = {
  root: string,
  deps: Array<Metadata>,
  args: Array<string>,
  stdio?: Stdio,
};
export type Lint = (LintArgs) => Promise<void>;
*/
const lint /*: Lint */ = async ({root, deps, args, stdio = 'inherit'}) => {
  const main = deps.slice(-1).pop();
  await batchBuild({root, deps, self: false, stdio: errorsOnly});
  await spawn(node, [yarn, 'lint', ...args], {
    stdio,
    env: process.env,
    cwd: main.dir,
  });
};

/*::
export type FlowArgs = {
  root: string,
  deps: Array<Metadata>,
  args: Array<string>,
  stdio?: Stdio,
};
export type Flow = (FlowArgs) => Promise<void>;
*/
const flow /*: Flow */ = async ({root, deps, args, stdio = 'inherit'}) => {
  const main = deps.slice(-1).pop();
  await batchBuild({root, deps, self: false, stdio: errorsOnly});
  await spawn(node, [yarn, 'flow', ...args], {
    stdio,
    env: process.env,
    cwd: main.dir,
  });
};

/*::
export type StartArgs = {
  root: string,
  deps: Array<Metadata>,
  args: Array<string>,
  stdio?: Stdio,
};
export type Start = (StartArgs) => Promise<void>;
*/
const start /*: Start */ = async ({root, deps, args, stdio = 'inherit'}) => {
  const main = deps.slice(-1).pop();
  await batchBuild({root, deps, self: true, stdio: errorsOnly});
  await spawn(node, [yarn, 'start', ...args], {
    stdio,
    env: process.env,
    cwd: main.dir,
  });
};

/*::
export type ExecArgs = {
  root: string,
  deps: Array<Metadata>,
  args: Array<string>,
  stdio?: Stdio,
};
export type Exec = (ExecArgs) => Promise<void>;
*/
const exec /*: Exec */ = async ({root, deps, args, stdio = 'inherit'}) => {
  const [command, ...params] = args;
  const main = deps.slice(-1).pop();
  const cwd = main.dir;
  const path = process.env.PATH || '';
  const bazelDir = dirname(bazel);
  const nodeDir = dirname(node);
  const env = {PATH: `${bazelDir}:${nodeDir}:${path}:${cwd}/node_modules/.bin`};
  await spawn(command, params, {stdio, env, cwd});
};

module.exports = {build, test, lint, flow, dev, start, exec};
