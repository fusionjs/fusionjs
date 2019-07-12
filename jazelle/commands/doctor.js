// @flow
const semver = require('semver');
const {resolve} = require('path');
const {getManifest} = require('../utils/get-manifest.js');
const {getLocalDependencies} = require('../utils/get-local-dependencies.js');
const {read} = require('../utils/node-helpers.js');

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
  ];
  errors.forEach(e => console.log(`${e}\n`));
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
  await withDeps(deps, async (dep, dependencies, key) => {
    const range = dependencies[key];
    const file = `${root}/node_modules/${key}/package.json`;
    const {version} = JSON.parse(await read(file, 'utf8'));
    if (!semver.satisfies(version, range)) {
      const error =
        `Hoisted dep version ${key}@${version} does not match ` +
        `range specified in ${dep.dir}/package.json for ${range}. ` +
        `This can happen if you depend on an older version of ${key} than your dependencies do. ` +
        `Change your range to include ${version}`;
      errors.push(error);
    }
  });
  return errors;
};

const detectCyclicalDeps = async ({deps}) => {
  const errors = [];
  for (const dep of deps) {
    const cyclical = [];
    collect(deps, dep, cyclical);
    for (const chain of cyclical) {
      const names = chain.map(dep => `- ${dep.meta.name}`).join('\n');
      errors.push(`Cyclical dependency chain:\n${names}`);
    }
  }
  return errors;
};
const collect = (deps, dep, cyclical, parents = new Set()) => {
  if (parents.has(dep)) {
    const list = [...parents, dep];
    cyclical.push(list.slice(list.indexOf(dep)));
  } else {
    parents.add(dep);
    for (const key in dep.meta.dependencies) {
      const target = deps.find(d => {
        return (
          d.meta.name === key &&
          semver.satisfies(d.meta.version, dep.meta.dependencies[key])
        );
      });
      if (target) collect(deps, target, cyclical, parents);
    }
  }
};

const withDeps = async (deps, fn) => {
  const types = ['dependencies', 'devDependencies'];
  for (const type of types) {
    for (const dep of deps) {
      for (const key in dep.meta[type] || {}) {
        await fn(dep, dep.meta[type], key);
      }
    }
  }
};

module.exports = {doctor};
