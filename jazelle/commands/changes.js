// @flow
const {findChangedTargets} = require('../utils/find-changed-targets.js');
const {getDownstreams} = require('../utils/get-downstreams.js');
const {getManifest} = require('../utils/get-manifest.js');
const {read} = require('../utils/node-helpers.js');

/*::
type ChangesArgs = {
  root: string,
  sha1?: string,
  sha2?: string,
  type?: string,
};
type Changes = (ChangesArgs) => Promise<void>;
*/
const changes /*: Changes */ = async ({root, sha1, sha2, type}) => {
  // Get every changed target
  const targets = await findChangedTargets({root, sha1, sha2, type});
  const changeSet = new Set(targets);

  const {projects} = await getManifest({root});
  const allProjects = await Promise.all([
    ...projects.map(async dir => {
      const meta = JSON.parse(
        await read(`${root}/${dir}/package.json`, 'utf8')
      );
      return {dir, meta, depth: 1};
    }),
  ]);

  // Add to the changeSet all downstream packages that have a dependency
  for (const target of targets) {
    const dep = allProjects.find(project => project.dir === target);
    if (dep) {
      const downstreamDeps = getDownstreams(allProjects, dep);
      for (const downstreamDep of downstreamDeps) {
        changeSet.add(downstreamDep.dir);
      }
    }
  }

  console.log(Array.from(changeSet).join('\n'));
};

module.exports = {changes};
