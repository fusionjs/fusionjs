const lockfile = require('@yarnpkg/lockfile');
const {dirname} = require('path');
const {createHash} = require('crypto');
const {ls, exists, exec, spawn, read, write} = require('./node-helpers.js');
const {node, yarn} = require('./binary-paths.js');

const installDeps = async (root, deps, hooks = {}) => {
  // jazelle hook
  if (hooks.preinstall) {
    // prioritize hermetic Node version over system version
    await exec(`PATH=${dirname(node)}\\:$PATH ${hooks.preinstall}`, {stdio: 'inherit'});
  }

  const bin = `${root}/third_party/jazelle/temp`;
  const cache = await getInstallationCache(bin);
  if (!cache.isCached()) {
    await exec(`${node} ${yarn} install --frozen-lockfile --offline --non-interactive --ignore-optional`, {cwd: bin});
    await cache.save();
  }

  const cacheDir = `${bin}/node_modules`;
  if (!await exists(cacheDir)) await spawn('mkdir', ['-p', cacheDir]);

  await Promise.all(
    deps.map(async dep => {
      const {object} = lockfile.parse(await read(`${dep.dir}/yarn.lock`, 'utf8'));
      await spawn('mkdir', ['-p', 'node_modules'], {cwd: dep.dir});
      await populate(cacheDir, deps, dep, 'dependencies', object);
      await populate(cacheDir, deps, dep, 'devDependencies', object);
    })
  );

  // jazelle hook
  if (hooks.postinstall) {
    await exec(`PATH=${dirname(node)}\\:$PATH ${hooks.postinstall}`, {stdio: 'inherit'});
  }
}
async function getInstallationCache(bin) {
  let key = await read(`${bin}/cache-key.txt`, 'utf8').catch(() => '');
  const lock = await read(`${bin}/yarn.lock`, 'utf8');
  const digest = createHash('sha256').update(lock).digest('hex');
  return {
    isCached() {
      return digest === key;
    },
    async save() {
      await write(`${bin}/cache-key.txt`, digest, 'utf8');
      key = digest;
    },
  }
}
async function extract(downloadDir, cacheDir) {
  const tars = (await exec(`find . -type f -name "*.tgz"`, {cwd: downloadDir})).trim().split('\n').sort();
  await Promise.all(
    tars.map(async tar => {
      const base = tar.slice(0, -4);
      if (!await exists(`${cacheDir}/${base}`)) {
        await spawn('mkdir', ['-p', `${cacheDir}/${base}`]);
        await spawn('tar', ['-xf', `${downloadDir}/${tar}`, '-C', `${cacheDir}/${base}`, '--strip-components', '1']);
      }
    })
  )
}
async function populate(cacheDir, deps, dep, type, lockfileObject) {
  await Promise.all(
    Object.keys(dep.meta[type] || {}).map(async name => {
      const versionRange = dep.meta[type][name];
      const item = lockfileObject[`${name}@${versionRange}`] || deps.map(d => d.meta).find(meta => meta.name === name);
      if (item) {
        const aliased = versionRange.startsWith('npm:') ? versionRange.match(/npm:(.[^@]*)/)[1] : name;
        const {version} = item;
        const [ns, basename] = name.includes('@') ? name.split('/') : ['.', name];
        const local = deps.find(({meta}) => meta.name === name && meta.version === version);
        const lnCwd = `${dep.dir}/node_modules/${ns}`;
        const depPath = local ? local.dir : `${cacheDir}/${aliased}`;
        if (ns !== '.') {
          if (!await exists(`${dep.dir}/node_modules/${ns}`)) {
            await spawn('mkdir', ['-p', ns], {cwd: `${dep.dir}/node_modules`});
          }
        }
        await exec(`rm -rf ${basename} && ln -s ${depPath}/ ${basename}`, {cwd: lnCwd}); // delete symlink to avoid generating recursive link to self on second run

        const binFolder = `${dep.dir}/node_modules/.bin`;
        await spawn('mkdir', ['-p', binFolder], {cwd: dep.dir});
        const {name: depName, bin} = JSON.parse(await read(`${depPath}/package.json`, 'utf8'));
        const commands = typeof bin === 'string' ? {[depName]: bin} : bin || {};
        await Promise.all(
          Object.keys(commands).map(async cmd => {
            await spawn('rm', ['-rf', cmd], {cwd: binFolder});
            await spawn('ln', ['-s', `${depPath}/${commands[cmd]}`, cmd], {cwd: binFolder});
          })
        )
      }
    })
  );
}

module.exports = {installDeps};