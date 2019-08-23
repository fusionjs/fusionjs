// @flow
const {dirname, relative} = require('path');
const {merge} = require('./lockfile.js');
const {exec, spawn} = require('./node-helpers.js');
const {node, yarn} = require('./binary-paths.js');
const {setupSymlinks} = require('./setup-symlinks.js');

/*::
import type {Metadata} from './get-local-dependencies.js';
import type {Hooks} from './get-manifest.js';

export type InstallDepsArgs = {
  root: string,
  cwd: string,
  modulesDir?: string,
  deps?: Array<Metadata>,
  ignore?: Array<Metadata>,
  hooks?: Hooks,
}
export type InstallDeps = (InstallDepsArgs) => Promise<void>
*/
const installDeps /*: InstallDeps */ = async ({
  root,
  cwd,
  modulesDir,
  deps = [],
  ignore = [],
  hooks: {preinstall, postinstall} = {},
}) => {
  const sandbox = relative(root, cwd);
  const bin = `${root}/third_party/jazelle/temp/${sandbox}`;
  await spawn('mkdir', ['-p', bin], {cwd: root});

  // generate global lock file
  const tmp = `${root}/third_party/jazelle/temp/yarn-utilities-tmp`;
  await spawn('rm', ['-f', `${bin}/yarn.lock`], {cwd: root});
  await spawn('rm', ['-f', `${bin}/package.json`], {cwd: root});
  await merge({
    roots: deps.map(dep => dep.dir),
    out: bin,
    ignore: ignore.map(dep => dep.meta.name),
    tmp,
  });

  // jazelle hook
  const nodePath = dirname(node);
  if (typeof preinstall === 'string') {
    // prioritize hermetic Node version over system version
    await exec(
      preinstall,
      {
        env: {...process.env, PATH: `${nodePath}:${String(process.env.PATH)}`},
        cwd: root,
      },
      [process.stdout, process.stderr]
    );
  }

  // package preinstall hook
  for (const dep of deps) {
    if (dep.meta.scripts && dep.meta.scripts.preinstall) {
      await exec(dep.meta.scripts.preinstall, {
        env: {...process.env, PATH: `${nodePath}:${String(process.env.PATH)}`},
        cwd: dep.dir,
      });
    }
  }

  // install external deps
  await spawn(
    node,
    [
      yarn,
      'install',
      '--frozen-lockfile',
      '--non-interactive',
      '--ignore-optional',
    ],
    {
      env: {
        ...process.env,
        PATH: `${nodePath}:${String(process.env.PATH)}`,
      },
      cwd: bin,
      stdio: 'inherit',
    }
  );

  if (modulesDir) {
    await setupSymlinks({root, bin, modulesDir, deps});
  }

  // package postinstall hook
  for (const dep of deps) {
    if (dep.meta.scripts && dep.meta.scripts.postinstall) {
      await exec(dep.meta.scripts.postinstall, {
        env: {...process.env, PATH: `${nodePath}:${String(process.env.PATH)}`},
        cwd: dep.dir,
      });
    }
  }

  // jazelle hook
  if (typeof postinstall === 'string') {
    await exec(
      postinstall,
      {
        env: {...process.env, PATH: `${nodePath}:${String(process.env.PATH)}`},
        cwd: root,
      },
      [process.stdout, process.stderr]
    );
  }
};

module.exports = {installDeps};
