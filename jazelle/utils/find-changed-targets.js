// @flow
const {getManifest} = require('./get-manifest.js');
const {exec} = require('./node-helpers.js');
const {bazel} = require('./binary-paths.js');

/*::
export type FindChangedTargetsArgs = {
  root: string,
  type: string,
};
export type FindChangedTargets = (FindChangedTargetsArgs) => Promise<Array<string>>;
*/
const findChangedTargets /*: FindChangedTargets */ = async ({root, type}) => {
  const targets = await findChangedBazelTargets({root});
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

const findChangedBazelTargets = async ({root}) => {
  const diff = await exec(`git diff-tree --no-commit-id --name-only -r HEAD`, {
    cwd: root,
  }).catch(() => null);
  const {projects, workspace} = await getManifest({root});
  if (workspace === 'sandbox') {
    if (diff !== null) {
      const files = diff.split('\n').filter(Boolean);
      const projects = await batch(files, file => {
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
    const set = new Set();
    if (diff !== null) {
      for (const project of projects) {
        for (const line of diff.split('\n').filter(Boolean)) {
          if (line.startsWith(project)) set.add(project);
        }
      }
    } else {
      for (const project of projects) set.add(project);
    }
    const targets = [];
    for (const project of set) {
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
