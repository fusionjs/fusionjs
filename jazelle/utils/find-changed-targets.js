// @flow
const {getManifest} = require('./get-manifest.js');
const {exec} = require('./node-helpers.js');
const {bazel} = require('./binary-paths.js');
const {getDownstreams} = require('../utils/get-downstreams.js');
const {read} = require('../utils/node-helpers.js');

/*::
export type FindChangedTargetsArgs = {
  root: string,
  files: string,
  type?: string,
};
export type FindChangedTargets = (FindChangedTargetsArgs) => Promise<Array<string>>;
*/
const findChangedTargets /*: FindChangedTargets */ = async ({
  root,
  files,
  type,
}) => {
  const targets = await findChangedBazelTargets({root, files});
  switch (type) {
    case 'bazel':
      return targets;
    case 'dirs':
    default: {
      const dirs = new Set();
      for (const target of targets) {
        dirs.add(target.slice(2, target.indexOf(':')));
      }
      return [...dirs];
    }
  }
};

const findChangedBazelTargets = async ({root, files}) => {
  const lines = (await read(files, 'utf8')).split('\n').filter(Boolean);
  const {projects, workspace} = await getManifest({root});
  if (workspace === 'sandbox') {
    if (lines.length > 0) {
      const projects = await batch(lines, file => {
        return `FILE=$(${bazel} query "${file}") && bazel query "attr('srcs', '$FILE', '\${FILE//:*/}:*')"`;
      });
      return batch(projects, project => {
        return `${bazel} query 'let graph = kind(".*_test rule", rdeps("...", "${project}")) in $graph except filter("node_modules", $graph)'`;
      });
    } else {
      const queried = await exec(
        `${bazel} query 'let graph = kind(".*_test rule", "...") in $graph except filter("node_modules", $graph)'`
      );
      return queried.trim().split('\n');
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
    } else {
      for (const project of projects) set.add(project);
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
    return targets;
  }
};

async function batch(items, fn) {
  const stdouts = await Promise.all(
    items.map(item => exec(fn(item)).catch(() => ''))
  );
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
