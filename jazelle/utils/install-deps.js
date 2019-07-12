// @flow
const lockfile = require('@yarnpkg/lockfile');
const {dirname} = require('path');
const {merge} = require('yarn-utilities');
const {exists, exec, read, write, spawn} = require('./node-helpers.js');
const {node, yarn} = require('./binary-paths.js');

/*::
import type {Metadata} from './get-local-dependencies.js';
import type {Hooks} from './get-manifest.js';

export type InstallDepsArgs = {
  root: string,
  deps?: Array<Metadata>,
  frozenLockfile?: boolean,
  hooks?: Hooks,
}
export type InstallDeps = (InstallDepsArgs) => Promise<void>
*/
const installDeps /*: InstallDeps */ = async ({
  root,
  deps = [],
  frozenLockfile = false,
  hooks: {preinstall, postinstall} = {},
}) => {
  const bin = `${root}/third_party/jazelle/temp`;
  await spawn('rm', ['-f', `${bin}/yarn.lock`]);
  await spawn('rm', ['-f', `${bin}/package.json`]);
  await merge({roots: deps.map(dep => dep.dir), out: bin, frozenLockfile}); // generate global lock file

  // delete local packages out of package.json
  const meta = JSON.parse(await read(`${bin}/package.json`, 'utf8'));
  deleteLocalPackages(meta, deps);
  await write(`${bin}/package.json`, JSON.stringify(meta, null, 2), 'utf8');

  const {object} = lockfile.parse(await read(`${bin}/yarn.lock`, 'utf8'));
  normalizeLockfileEntries(object);
  await write(`${bin}/yarn.lock`, lockfile.stringify(object), 'utf8');

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

  // install external deps
  const modulesDir = `${root}/node_modules`;
  if (await exists(modulesDir)) {
    await spawn('mv', ['node_modules', `${bin}/node_modules`], {
      cwd: root,
    });
  }
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
  await spawn('mv', [`${bin}/node_modules`, 'node_modules'], {
    cwd: root,
  });

  // symlink local deps
  await Promise.all(
    deps.map(async dep => {
      const [ns, basename] = dep.meta.name.startsWith('@')
        ? dep.meta.name.split('/')
        : ['.', dep.meta.name];
      if (!(await exists(`${modulesDir}/${dep.meta.name}`))) {
        await spawn('mkdir', ['-p', `${modulesDir}/${ns}`], {cwd: root});
        await spawn('ln', ['-sf', dep.dir, basename], {
          cwd: `${modulesDir}/${ns}`,
        });
      }

      if (!(await exists(`${dep.dir}/node_modules/.bin`))) {
        await spawn('mkdir', ['-p', 'node_modules'], {cwd: dep.dir});
        await spawn('ln', ['-sf', `${modulesDir}/.bin`, '.bin'], {
          cwd: `${dep.dir}/node_modules`,
        });
      }
    })
  );

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

const deleteLocalPackages = (meta, deps) => {
  for (const key in meta.dependencies || {}) {
    const found = deps.find(({meta: {name, version}}) => {
      return name === key && version === meta.dependencies[key];
    });
    if (found) {
      delete meta.dependencies[key];
    }
  }
  for (const key in meta.devDependencies || {}) {
    const found = deps.find(({meta: {name, version}}) => {
      return name === key && version === meta.devDependencies[key];
    });
    if (found) {
      delete meta.devDependencies[key];
    }
  }
};

const normalizeLockfileEntries = object => {
  Object.keys(object).forEach(key => {
    // remove optionalDependencies, to avoid buggy yarn nag later
    delete object[key].optionalDependencies;
  });
};

module.exports = {installDeps};
