// @flow
const {getManifest} = require('../utils/get-manifest.js');
const {getAllDependencies} = require('../utils/get-all-dependencies.js');
const {read, write} = require('../utils/node-helpers.js');
const {install} = require('./install.js');

/*::
type AlignArgs = {
  root: string,
  cwd: string,
}
type Align = (AlignArgs) => Promise<void>
*/
const align /*: Align */ = async ({root, cwd}) => {
  const {projects, versionPolicy} = /*:: await */ await getManifest({root});
  if (versionPolicy) {
    const deps = await getAllDependencies({root, projects});
    const meta = JSON.parse(await read(`${cwd}/package.json`, 'utf8'));
    const others = deps.filter(dep => dep.meta.name !== meta.name);
    const types = ['dependencies', 'devDependencies', 'resolutions'];
    let changed = false;
    for (const type of types) {
      if (meta[type]) {
        for (const name in meta[type]) {
          if (shouldSyncVersions({versionPolicy, name})) {
            const version = getVersion({name, deps: others});
            if (version !== null) {
              meta[type][name] = version;
              changed = true;
            }
          }
        }
      }
    }
    if (changed) {
      const modified = JSON.stringify(meta, null, 2) + '\n';
      await write(`${cwd}/package.json`, modified, 'utf8');
    }
  }
  await install({root, cwd});
};

const shouldSyncVersions = ({versionPolicy, name}) => {
  const {lockstep = false, exceptions = []} = versionPolicy;
  return (
    (lockstep && !exceptions.includes(name)) ||
    (!lockstep && exceptions.includes(name))
  );
};

const getVersion = ({name, deps}) => {
  const types = ['dependencies', 'devDependencies', 'resolutions'];
  for (const {meta} of deps) {
    for (const type of types) {
      for (const key in meta[type]) {
        if (name === key) return meta[type][key];
      }
    }
  }
  return null;
};

module.exports = {align};
