// @flow
const {getManifest} = require('./get-manifest.js');
const {exec} = require('./node-helpers.js');
const {bazel} = require('./binary-paths.js');
const {getDownstreams} = require('../utils/get-downstreams.js');
const {exists, read} = require('../utils/node-helpers.js');

/*::
export type FindChangedTargetsArgs = {
  root: string,
  files?: string,
  format?: string,
};
export type FindChangedTargets = (FindChangedTargetsArgs) => Promise<Array<string>>;
*/
const findChangedTargets /*: FindChangedTargets */ = async ({
  root,
  files,
  format = 'targets',
}) => {
  let {targets} = await findChangedBazelTargets({root, files});

  if (format === 'dirs') {
    targets = [
      ...targets.reduce((set, target) => {
        // convert from target to dir path
        set.add(target.slice(2, target.indexOf(':')));
        return set;
      }, new Set()),
    ];
  }

  return targets;
};

const scan = async (root, lines) => {
  const result = await Promise.all(
    lines.map(async file => [file, await exists(`${root}/${file}`)])
  );
  return [
    result.filter(r => !r[1]).map(r => r[0]),
    result.filter(r => r[1]).map(r => r[0]),
  ];
};

const batches = (q, size) => {
  const result = [];
  const copy = [...q];
  while (copy.length) {
    result.push(copy.splice(0, size));
  }
  return result;
};

const findChangedBazelTargets = async ({root, files}) => {
  // if no file, fallback to reading from stdin (fd=0)
  const data = await read(files || 0, 'utf8').catch(() => '');
  const lines = data.split('\n').filter(Boolean);
  const {projects, workspace} = await getManifest({root});
  const opts = {cwd: root, maxBuffer: 1e8};
  if (workspace === 'sandbox') {
    if (lines.includes('WORKSPACE') || lines.includes('.bazelversion')) {
      const cmd = `${bazel} query 'kind(".*_test rule", "...")'`;
      const result = await exec(cmd, opts);
      const unfiltered = result.split('\n').filter(Boolean);
      const targets = unfiltered.filter(target => {
        const path = target.replace(/\/\/(.+?):.+/, '$1');
        return projects.includes(path);
      });
      return {workspace, targets};
    } else {
      /*
        Separate files into two categories: files that exist and files that have been deleted
        For files that have been deleted, try to recover some other file in the package
      */
      const [missing, exists] = await scan(root, lines);
      const recoveredMissing = await batch(root, missing, async file => {
        const find = `${bazel} query "${file}"`;
        const result = await exec(find, opts).catch(async e => {
          // if file doesn't exist, find which package it would've belong to, and find another file in the same package
          // doing so is sufficient, because we just want to find out which targets have changed
          // - in the case the file was deleted but a package still exists, pkg will refer to the package
          // - in the case the package itself was deleted, pkg will refer to the root package (which will typically yield no targets in a typical Jazelle setup)
          const regex = /not declared in package '(.*?)'/;
          const [, pkg = ''] = e.message.match(regex) || [];
          if (pkg === '') return '';
          const cmd = `${bazel} query 'kind("source file", //${pkg}:*)' | head -n 1`;
          return exec(cmd).catch(() => '');
        });
        return result;
      });
      const queryables = [...exists, ...recoveredMissing];
      const unfiltered = await batch(
        root,
        batches(queryables, 1000), // batching required, else E2BIG errors
        async q => {
          const innerQuery = q.join(' union ');
          const cmd = `${bazel} query 'let graph = kind(".*_test rule", rdeps("...", ${innerQuery})) in $graph except filter("node_modules", $graph)' --output label`;
          return exec(cmd, opts);
        }
      );

      const targets = unfiltered.filter(target => {
        const path = target.replace(/\/\/(.+?):.+/, '$1');
        return projects.includes(path);
      });
      return {workspace, targets};
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

    if (lines.includes('WORKSPACE')) {
      const targets = [];
      for (const project of projects) {
        targets.push(
          `//${project}:test`,
          `//${project}:lint`,
          `//${project}:flow`
        );
      }
      return {workspace, targets};
    } else {
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
