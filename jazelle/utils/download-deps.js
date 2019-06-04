const {URL} = require('url');
const {resolve} = require('path');
const {cpus} = require('os');
const {merge} = require('yarn-utilities');
const lockfile = require('@yarnpkg/lockfile');
const {read, write, spawn, exec, exists} = require('./node-helpers.js');
const {node, yarn} = require('./binary-paths.js');

const downloadDeps = async (root, deps) => {
  const config = await readNpmrc(root);
  const auth = config._auth ? Buffer.from(config._auth, 'base64').toString('ascii') + '@' : '';
  const url = new URL(config.registry || 'https://registry.npmjs.org');
  if (auth) {
    const [user, pass] = auth.split(':');
    url.username = user;
    url.password = pass.replace(/@/g, '');
  }
  const registry = url.toString();

  const bin = `${root}/third_party/jazelle/temp`;
  const cache = `${bin}/.yarn-cache`;
  await spawn('mkdir', ['-p', cache]);
  await merge({roots: deps.map(dep => dep.dir), out: bin}); // generate global lock file

  // delete local packages out of package.json
  const meta = JSON.parse(await read(`${bin}/package.json`, 'utf8'));
  for (const key in meta.dependencies || {}) {
    if (deps.find(dep => dep.meta.name === key && dep.meta.version === meta.dependencies[key])) {
      delete meta.dependencies[key];
    }
  }
  for (const key in meta.devDependencies || {}) {
    if (deps.find(dep => dep.meta.name === key && dep.meta.version === meta.dependencies[key])) {
      delete meta.dependencies[key];
    }
  }
  await write(`${bin}/package.json`, JSON.stringify(meta, null, 2), 'utf8');

  await write(`${bin}/.yarnrc`, 'yarn-offline-mirror "./.yarn-cache"', 'utf8');

  // remove optionalDependencies, to avoid buggy yarn nag later
  const {object} = lockfile.parse(await read(`${bin}/yarn.lock`, 'utf8'));
  Object.keys(object).forEach(key => {
    delete object[key].optionalDependencies;
  });
  await write(`${bin}/yarn.lock`, lockfile.stringify(object), 'utf8');

  const commands = {};
  Object.keys(object).forEach(key => {
    const [, alias] = key.match(/.+@(.+)/);
    const actualName = alias.startsWith('npm:')
      ? alias.match(/npm:(.[^@]*)/)[1]
      : new URL(object[key].resolved).pathname.split('/')[1];
    const version = object[key].version;
    const filename = `${cache}/${actualName.replace(/\/|%2f/g, '-')}-${version}.tgz`;
    const pathname = new URL(object[key].resolved).pathname;
    // dedupe commands
    commands[filename] = `curl --retry 2 -o '${filename}' '${registry}${pathname}'`;
  });
  await chunk(Object.keys(commands), async target => {
    if (!await exists(target)) {
      await exec(commands[target], {cwd: root}).catch(() => {
        return exec(commands[target], {cwd: root}); // try again if curl itself crashes
      });
    }
  });
}
const readNpmrc = async dir => {
  const npmrcs = await findNpmrcs(dir);
  const configs = npmrcs.map(npmrc => {
    return npmrc.replace(/[#;].*[\r\n]/gm, '').split('\n').reduce((memo, line) => {
      const [key, ...rest] = line.split('=');
      // TODO handle `key[] = value` syntax
      if (key) memo[key.trim()] = rest.join('=').replace(/\$\{([^\}]+)\}/g, (match, key) => process.env[key]);
      return memo;
    }, {});
  });
  return Object.assign({}, ...configs.reverse());
}
const findNpmrcs = async dir => {
  const npmrcs = [await read(`${dir}/.npmrc`, 'utf8').catch(() => '')];
  if (resolve(`${dir}/..`) !== '/') npmrcs.push(...await findNpmrcs(`${dir}/..`));
  return npmrcs;
}
const chunk = async (list, fn) => {
  for (let i = 0, size = cpus().length; i < list.length; i += size) {
    await Promise.all(list.slice(i, i + size).map(fn));
  }
}

module.exports = {downloadDeps};
