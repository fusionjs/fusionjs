// @flow
const {satisfies} = require('semver');
const {resolve} = require('path');
const {getManifest} = require('../utils/get-manifest.js');
const {getLocalDependencies} = require('../utils/get-local-dependencies.js');
const {ci} = require('../commands/ci.js');
const {read, exists} = require('../utils/node-helpers.js');

/*::
export type DoctorArgs = {
  root: string,
  cwd: string,
};
export type Doctor = (DoctorArgs) => Promise<void>;
*/
const doctor /*: Doctor */ = async ({root, cwd}) => {
  const {projects} = await getManifest({root});
  const deps = /*:: await */ await getLocalDependencies({
    dirs: projects.map(dir => `${root}/${dir}`),
    target: resolve(root, cwd),
  });
  const errors = [
    ...(await detectDanglingPeerDeps({deps})),
    ...(await detectHoistMismatch({root, deps})),
    ...(await detectCyclicalDeps({deps})),
    ...(await detectOutdatedLockfiles({root, cwd})),
  ];
  if (errors.length > 0) {
    errors.forEach(e => console.log(`${e}\n`));
    process.exit(1);
  } else {
    console.log(`No problems found in ${cwd}`);
  }
};

const detectDanglingPeerDeps = async ({deps}) => {
  const errors = [];
  for (const dep of deps) {
    if (dep.meta.peerDependencies) {
      for (const name in dep.meta.peerDependencies) {
        const inDeps = dep.meta.dependencies
          ? name in dep.meta.dependencies
          : false;
        const inDev = dep.meta.devDependencies
          ? name in dep.meta.devDependencies
          : false;
        if (!inDeps && !inDev) {
          const error = `Peer dep \`${name}\` in ${dep.meta.name} should also be a devDependency`;
          errors.push(error);
        }
      }
    }
  }
  return errors;
};

const detectHoistMismatch = async ({root, deps}) => {
  const errors = [];
  for (const dep of deps) {
    for (const {name, range} of getDepEntries(dep)) {
      const file = `${root}/node_modules/${name}/package.json`;
      if (!(await exists(file))) continue;
      const {version} = JSON.parse(await read(file, 'utf8'));
      if (!satisfies(version, range)) {
        const error =
          `Hoisted dep version ${name}@${range} does not match ` +
          `range specified in ${dep.dir}/package.json for ${range}. ` +
          `This can happen if you depend on an older version of ${name} than your dependencies do. ` +
          `Change your range to include ${version}`;
        errors.push(error);
      }
    }
  }
  return errors;
};

const detectCyclicalDeps = async ({deps}) => {
  const errors = [];
  const index = {};
  for (const dep of deps) {
    const {name} = dep.meta;
    index[name] = dep;
  }

  // detect
  const cycles = [];
  for (const dep of deps) {
    collect(index, dep, cycles);
  }
  // dedupe
  const map = {};
  for (const cycle of cycles) {
    const key = cycle.sort().join();
    map[key] = cycle;
  }
  for (const key in map) {
    const names = map[key].map(dep => `- ${dep.meta.name}`).join('\n');
    errors.push(`Cyclical dependency chain detected containing:\n${names}`);
  }
  return errors;
};
const collect = (index, dep, cycles, set = new Set()) => {
  if (set.has(dep)) {
    const list = [...set];
    cycles.push(list.slice(list.indexOf(dep)));
  } else {
    set.add(dep);
    for (const {name, range} of getDepEntries(dep.meta)) {
      const target = index[name];
      if (target && satisfies(target.meta.version, range)) {
        collect(index, target, cycles, set);
      }
    }
  }
};

const detectOutdatedLockfiles = async ({root, cwd}) => {
  const errors = [];
  await ci({root, cwd}).catch(() => {
    errors.push(`A lockfile is outdated. Run \`jazelle install\``);
  });
  return errors;
};

const getDepEntries = meta => {
  const types = ['dependencies', 'devDependencies'];
  const entries = [];
  for (const type of types) {
    for (const name in meta[type]) {
      entries.push({name, range: meta[type][name], type});
    }
  }
  return entries;
};

module.exports = {doctor};
