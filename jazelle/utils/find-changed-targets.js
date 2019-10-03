// @flow
const {getManifest} = require('./get-manifest.js');
const {exec} = require('./node-helpers.js');
const {bazel} = require('./binary-paths.js');
const {getDownstreams} = require('../utils/get-downstreams.js');
const {read} = require('../utils/node-helpers.js');

/*::
export type FindChangedTargetsArgs = {
  root: string,
  files?: string,
};
export type FindChangedTargets = (FindChangedTargetsArgs) => Promise<Array<string>>;
*/
const findChangedTargets /*: FindChangedTargets */ = async ({root, files}) => {
  const {workspace, targets} = await findChangedBazelTargets({root, files});
  switch (workspace) {
    case 'host': {
      const dirs = new Set();
      for (const target of targets) {
        dirs.add(target.slice(2, target.indexOf(':')));
      }
      return [...dirs];
    }
    default:
    case 'sandbox':
      return targets;
  }
};

const findChangedBazelTargets = async ({root, files}) => {
  // if no file, fallback to reading from stdin (fd=0)
  const data = await read(files || 0, 'utf8').catch(() => '');
  const lines = data.split('\n').filter(Boolean);
  const {projects, workspace} = await getManifest({root});
  if (workspace === 'sandbox') {
    if (lines.length > 0) {
      const projects = await batch(root, lines, async file => {
        const result = await exec(`${bazel} query "${file}"`, {cwd: root});
        const target = result.trim();
        const all = target.replace(/:.+/, ':*');
        const cmd = `${bazel} query "attr('srcs', '${target}', '${all}')"`;
        return exec(cmd, {cwd: root});
      });
      const targets = await batch(root, projects, async project => {
        const cmd = `${bazel} query 'let graph = kind(".*_test rule", rdeps("...", "${project}")) in $graph except filter("node_modules", $graph)'`;
        return exec(cmd, {cwd: root});
      });
      return {workspace, targets};
    } else {
      return {workspace, targets: []};
    }
  } else {
    const allProjects = await Promise.all([
      ...projects.map(async dir => {
        const meta = JSON.parse(
          await read(`${root}/${dir}/package.json`, 'utf8')
        );
        return {dir, meta, depth: 1};
      }),
    ]);

    const set = new Set();
    if (lines.length > 0) {
      for (const project of projects) {
        for (const line of lines) {
          if (line.startsWith(project)) set.add(project);
        }
      }
    }

    // Add to the changeSet all downstream packages that have a dependency
    const changeSet = new Set(set);
    for (const target of set) {
      const dep = allProjects.find(project => project.dir === target);
      if (dep) {
        const downstreamDeps = getDownstreams(allProjects, dep);
        for (const downstreamDep of downstreamDeps) {
          changeSet.add(downstreamDep.dir);
        }
      }
    }

    const targets = [];
    for (const project of changeSet) {
      targets.push(
        `//${project}:test`,
        `//${project}:lint`,
        `//${project}:flow`
      );
    }
    return {workspace, targets};
  }
};

async function batch(root, items, fn) {
  const stdouts = await Promise.all(items.map(fn));
  return [
    ...new Set(
      stdouts
        .map(r => r.trim())
        .join('\n')
        .split('\n')
    ),
  ].filter(Boolean);
}

module.exports = {findChangedTargets};
