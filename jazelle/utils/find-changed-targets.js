// @flow
const {exec} = require('../utils/node-helpers.js');
const {bazel} = require('../utils/binary-paths.js');

/*::
export type FindChangedTargetsArgs = {
  root: string,
};
export type FindChangedTargets = (FindChangedTargetsArgs) => Promise<Array<string>>;
*/
const findChangedTargets /*: FindChangedTargets */ = async ({root}) => {
  const diff = await exec(`git diff-tree --no-commit-id --name-only -r HEAD`, {
    cwd: root,
  }).catch(() => null);
  if (diff !== null) {
    const files = diff.split('\n').filter(Boolean);
    const projects = await batch(files, file => {
      return `FILE=$(bazel query "${file}") && bazel query "attr('srcs', '$FILE', '\${FILE//:*/}:*')"`;
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
};

async function batch(items, fn) {
  const stdouts = await Promise.all(items.map(item => exec(fn(item))));
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
