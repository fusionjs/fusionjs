// @flow
const {inc} = require('../vendor/semver/index.js');
const {assertProjectDir} = require('../utils/assert-project-dir.js');
const {getManifest} = require('../utils/get-manifest.js');
const {getLocalDependencies} = require('../utils/get-local-dependencies.js');
const {exec, write} = require('../utils/node-helpers.js');
const {node, yarn} = require('../utils/binary-paths.js');
const {upgrade} = require('./upgrade.js');

/*::
type BumpArgs = {
  root: string,
  cwd: string,
  type: string,
  frozenPackageJson?: boolean,
}
type Bump = (BumpArgs) => Promise<void>
*/

const bump /*: Bump */ = async ({
  root,
  cwd,
  type,
  frozenPackageJson = false,
}) => {
  await assertProjectDir({dir: cwd});

  const {projects} = await getManifest({root});
  const deps = await getLocalDependencies({
    dirs: projects.map(dir => `${root}/${dir}`),
    target: cwd,
  });

  const types = /^(major|premajor|minor|preminor|patch|prepatch|prerelease|none)$/;
  if (!types.test(type)) {
    throw new Error(
      `Invalid bump type: ${type}. Must be major, premajor, minor, preminor, patch, prepatch, prerelease or none`
    );
  }

  for (const dep of deps) {
    const query = `${node} ${yarn} info ${dep.meta.name} versions --json`;
    const data = await exec(query, {cwd: root, env: process.env});
    const version = parseVersion(data);
    const old = dep.meta.version;
    const next = type === 'none' ? version : inc(version, type);

    if (next !== old) {
      if (frozenPackageJson) {
        throw new Error(
          `Cannot bump version when frozenPackageJson is true. You most likely forgot to bump a dependency's version locally`
        );
      }

      dep.meta.version = next;
      await write(
        `${dep.dir}/package.json`,
        `${JSON.stringify(dep.meta, null, 2)}\n`,
        'utf8'
      );

      await upgrade({
        root,
        cwd,
        args: [`${dep.meta.name}@${dep.meta.version}`],
      });
    }
  }
};

const parseVersion = data => {
  const versions = data ? JSON.parse(data).data : [];
  return versions.length > 0 ? versions.pop() : '0.0.0';
};

module.exports = {bump};
