// @flow
const {dirname, relative} = require('path');

const {isDepsetSubset} = require('./is-depset-subset.js');
const {merge} = require('./lockfile.js');
const {read, exec, spawn, write, exists} = require('./node-helpers.js');
const {node, yarn} = require('./binary-paths.js');
const {setupSymlinks} = require('./setup-symlinks.js');

/*::
import type {Metadata} from './get-local-dependencies.js';
import type {Hooks} from './get-manifest.js';

export type InstallDepsArgs = {
  root: string,
  cwd: string,
  deps?: Array<Metadata>,
  ignore?: Array<Metadata>,
  hooks?: Hooks,
}
export type InstallDeps = (InstallDepsArgs) => Promise<void>
*/
const installDeps /*: InstallDeps */ = async ({
  root,
  cwd,
  deps = [],
  ignore = [],
  hooks: {preinstall, postinstall} = {},
}) => {
  const modulesDir = `${root}/node_modules`;
  const sandbox = relative(root, cwd);
  const bin = `${root}/third_party/jazelle/temp/${sandbox}`;
  await spawn('mkdir', ['-p', bin], {cwd: root});

  // we may already have things installed. If so, check whether we need to reinstall
  let needsInstall = true;
  if (modulesDir && (await exists(modulesDir))) {
    await spawn('mv', [modulesDir, `${bin}/node_modules`], {cwd: root});
    const prevSource = `${bin}/node_modules/.jazelle-source`;
    const prev = JSON.parse(await read(prevSource, 'utf8'));
    const currMeta = JSON.parse(await read(`${cwd}/package.json`, 'utf8'));
    needsInstall = !isDepsetSubset({of: prev.meta, it: currMeta});
  }

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
  if (needsInstall) {
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
    // record the source of this node_modules so we are able to recycle on future installs if needed
    const meta = deps[deps.length - 1];
    const sourceFile = `${bin}/node_modules/.jazelle-source`;
    await write(sourceFile, JSON.stringify(meta, null, 2), 'utf8');
  }

  await spawn('mv', [`${bin}/node_modules`, modulesDir], {cwd: root});
  await setupSymlinks({root, deps});

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
