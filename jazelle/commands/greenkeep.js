const {upgrade: upgradeDep} = require('yarn-utilities');
const {getManifest} = require('../utils/get-manifest.js');
const {findLocalDependency} = require('../utils/find-local-dependency.js');
const {generateDepLockfiles} = require('../utils/generate-dep-lockfiles.js');
const {read, write} = require('../utils/node-helpers.js');

async function greenkeep({root, name, version}) {
  const manifest = await getManifest(root);
  const roots = manifest.projects.map(dir => `${root}/${dir}`);
  const local = await findLocalDependency(root, name);
  if (local) {
    if (version && version !== local.meta.version) {
      throw new Error(`You must use version ${local.meta.version}`);
    }

    await Promise.all(
      roots.map(async cwd => {
        const meta = JSON.parse(await read(`${cwd}/package.json`, 'utf8'));
        if (meta.dependencies && meta.dependencies[name]) meta.dependencies[name] = local.meta.version;
        if (meta.devDependencies && meta.devDependencies[name]) meta.devDependencies[name] = local.meta.version;
        if (meta.peerDependencies && meta.peerDependencies[name]) meta.peerDependencies[name] = local.meta.version;
        if (meta.optionalDependencies && meta.optionalDependencies[name]) meta.optionalDependencies[name] = local.meta.version;
        await write(`${cwd}/package.json`, JSON.stringify(meta, null, 2), 'utf8');
      })
    );
  } else {
    await upgradeDep({roots, dep: name, version});
  }
  const deps = await Promise.all(
    roots.map(async dir => ({
      dir,
      meta: JSON.parse(await read(`${dir}/package.json`, 'utf8')),
    }))
  );
  await generateDepLockfiles(deps);
}

module.exports = {greenkeep};