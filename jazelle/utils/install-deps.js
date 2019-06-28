// @flow
const lockfile = require('@yarnpkg/lockfile');
const {dirname} = require('path');
const {createHash} = require('crypto');
const {exists, exec, spawn, read, write} = require('./node-helpers.js');
const {node, yarn} = require('./binary-paths.js');

/*::
import type {Metadata} from './get-local-dependencies.js';
import type {Hooks} from './get-manifest.js';

export type InstallDepsArgs = {
  root: string,
  deps?: Array<Metadata>,
  hooks?: Hooks,
}
export type InstallDeps = (InstallDepsArgs) => Promise<void>
*/
const installDeps /*: InstallDeps */ = async ({
  root,
  deps = [],
  hooks: {preinstall, postinstall} = {},
}) => {
  // jazelle hook
  if (typeof preinstall === 'string') {
    // prioritize hermetic Node version over system version
    await exec(`PATH=${dirname(node)}\\:$PATH ${preinstall}`, {
      stdio: 'inherit',
    });
  }

  const bin = `${root}/third_party/jazelle/temp`;
  const cache = await getInstallationCache(bin);
  const isCached = cache.isCached();
  if (!isCached) {
    await exec(
      `${node} ${yarn} install --frozen-lockfile --offline --non-interactive --ignore-optional`,
      {cwd: bin}
    );
  }

  const cacheDir = `${bin}/node_modules`;
  if (!(await exists(cacheDir))) await spawn('mkdir', ['-p', cacheDir]);

  await Promise.all(
    deps.map(async dep => {
      const {object} = lockfile.parse(
        await read(`${dep.dir}/yarn.lock`, 'utf8')
      );
      let hoisted = {};
      await spawn('mkdir', ['-p', 'node_modules'], {cwd: dep.dir});
      hoisted = await populate(
        cacheDir,
        deps,
        dep,
        'dependencies',
        object,
        hoisted
      );
      hoisted = await populate(
        cacheDir,
        deps,
        dep,
        'devDependencies',
        object,
        hoisted
      );
      if (!isCached) {
        await populateTransitive(root, dep, hoisted);
      }
    })
  );

  // jazelle hook
  if (typeof postinstall === 'string') {
    await exec(`PATH=${dirname(node)}\\:$PATH ${postinstall}`, {
      stdio: 'inherit',
    });
  }

  if (!isCached) {
    await cache.save();
  }
};

async function getInstallationCache(bin) {
  let key = await read(`${bin}/cache-key.txt`, 'utf8').catch(() => '');
  const lock = await read(`${bin}/yarn.lock`, 'utf8');
  const digest = createHash('sha256')
    .update(lock)
    .digest('hex');
  return {
    isCached() {
      return digest === key;
    },
    async save() {
      await write(`${bin}/cache-key.txt`, digest, 'utf8');
      key = digest;
    },
  };
}

async function populate(cacheDir, deps, dep, type, lockfileObject, hoisted) {
  const dependencies = dep.meta[type] || {};
  await Promise.all(
    Object.keys(dependencies).map(async name => {
      const versionRange = String(dependencies[name]); // coerce to string to make Flow happy
      const item =
        lockfileObject[`${name}@${versionRange}`] ||
        deps.map(d => d.meta).find(meta => meta.name === name);
      if (item && !hoisted[name]) {
        const aliased = versionRange.startsWith('npm:')
          ? (versionRange.match(/npm:(.[^@]*)/) || [])[1]
          : name;
        const {version} = item;
        const [ns, basename] = name.includes('@')
          ? name.split('/')
          : ['.', name];
        const local = deps.find(
          ({meta}) => meta.name === name && meta.version === version
        );
        const lnCwd = `${dep.dir}/node_modules/${ns}`;
        const depPath = local ? local.dir : `${cacheDir}/${aliased}`;
        if (ns !== '.') {
          if (!(await exists(`${dep.dir}/node_modules/${ns}`))) {
            await spawn('mkdir', ['-p', ns], {cwd: `${dep.dir}/node_modules`});
          }
        }
        await exec(`rm -rf ${basename} && ln -s ${depPath}/ ${basename}`, {
          cwd: lnCwd,
        }); // delete symlink to avoid generating recursive link to self on second run

        const binFolder = `${dep.dir}/node_modules/.bin`;
        await spawn('mkdir', ['-p', binFolder], {cwd: dep.dir});
        const {name: depName, bin} = JSON.parse(
          await read(`${depPath}/package.json`, 'utf8')
        );
        const commands = typeof bin === 'string' ? {[depName]: bin} : bin || {};
        await Promise.all(
          Object.keys(commands).map(async cmd => {
            await spawn('rm', ['-rf', cmd], {cwd: binFolder});
            await spawn('ln', ['-s', `${depPath}/${commands[cmd]}`, cmd], {
              cwd: binFolder,
            });
          })
        );

        hoisted[name] = item;
      }
    })
  );
  return hoisted;
}

async function populateTransitive(root, dep, hoisted) {
  const cacheDir = `${root}/third_party/jazelle/temp/node_modules`;
  const dir = `${dep.dir}/node_modules`;
  const deps = (await exec('find . -name package.json -type f', {
    cwd: cacheDir,
  }))
    .trim()
    .split('\n')
    .map(file => dirname(file).slice(2))
    .filter(file => file.match(/^[a-z0-9-_$]+$|^@[a-z0-9-_$]+\/[a-z0-9-_$]+$/))
    .filter(dep => !(dep in hoisted));
  for (let i = 0, size = 300; i < deps.length; i += size) {
    await Promise.all(
      deps.slice(i, i + size).map(async dep => {
        const prep = dep.includes('/') ? `mkdir -p ${dirname(dep)} && ` : '';
        await exec(`${prep} rm -rf ${dep} && ln -s ${cacheDir}/${dep} ${dep}`, {
          cwd: dir,
        });
      })
    );
  }
}

module.exports = {installDeps};
