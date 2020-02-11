// @flow
const {dirname, relative} = require('path');

const {getHash} = require('./checksum-cache.js');
const {merge} = require('./lockfile.js');
const {read, exec, spawn, write, exists, remove} = require('./node-helpers.js');
const {node, yarn} = require('./binary-paths.js');
const {setupSymlinks} = require('./setup-symlinks.js');
const {executeHook} = require('./execute-hook.js');

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
  const hash = await getHash(`${cwd}/yarn.lock`);
  if (await exists(`${modulesDir}/.jazelle-source`)) {
    const data = await read(`${modulesDir}/.jazelle-source`, 'utf8');
    const prev = JSON.parse(data);
    if (await exists(prev.dir)) await remove(prev.dir);
    await spawn('mv', [`${modulesDir}/`, prev.dir], {cwd: root});

    if (await exists(`${bin}/node_modules/.jazelle-source`)) {
      const data = await read(`${bin}/node_modules/.jazelle-source`, 'utf8');
      const curr = JSON.parse(data);
      if (hash === curr.hash) needsInstall = false;
    }
  }

  await generateLockfile({root, bin, deps, ignore});

  // jazelle hook
  await executeHook(preinstall, root);
  await executeNpmHooks(deps, 'preinstall');

  // install external deps
  if (needsInstall) await generateNodeModules(bin);

  if (await exists(modulesDir)) {
    await remove(`${root}/${modulesDir}`);
  }
  await spawn('mv', [`${bin}/node_modules/`, modulesDir], {cwd: root});
  await setupSymlinks({root, deps});

  await executeNpmHooks(deps, 'postinstall');
  await executeHook(postinstall, root);

  // record the source of this node_modules so we are able to recycle on future installs if needed
  const sourceFile = `${modulesDir}/.jazelle-source`;
  const data = {dir: `${bin}/node_modules`, hash};
  await write(sourceFile, JSON.stringify(data, null, 2), 'utf8');
};

const executeNpmHooks = async (deps, type) => {
  const nodePath = dirname(node);
  for (const dep of deps) {
    const options = {
      env: {
        ...process.env,
        PATH: `${nodePath}:${String(process.env.PATH)}`,
      },
      cwd: dep.dir,
    };
    const stdio = [process.stdout, process.stderr];
    if (dep.meta.scripts && dep.meta.scripts[type]) {
      await exec(dep.meta.scripts[type], options, stdio);
    }
  }
};

const generateLockfile = async ({root, bin, deps, ignore}) => {
  const tmp = `${root}/third_party/jazelle/temp/yarn-utilities-tmp`;
  await spawn('rm', ['-f', `${bin}/yarn.lock`], {cwd: root});
  await spawn('rm', ['-f', `${bin}/package.json`], {cwd: root});
  await merge({
    roots: deps.map(dep => dep.dir),
    out: bin,
    ignore: ignore.map(dep => dep.meta.name),
    tmp,
  });
};

const generateNodeModules = async bin => {
  const nodePath = dirname(node);
  const args = [
    yarn,
    'install',
    '--pure-lockfile',
    '--non-interactive',
    '--ignore-optional',
  ];
  const options = {
    env: {
      ...process.env,
      PATH: `${nodePath}:${String(process.env.PATH)}`,
    },
    cwd: bin,
    stdio: 'inherit',
  };
  await spawn(node, args, options);
};

module.exports = {installDeps};
