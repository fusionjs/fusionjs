const {relative} = require('path');
const {spawn, exists, read, write} = require('./node-helpers.js');
const {getCallArgItems, addCallArgItem, removeCallArgItem} = require('./starlark.js');

const generateBazelBuildRules = async (root, deps, projects) => {
  const depMap = deps.reduce((map, dep) => {
    map[dep.meta.name] = dep;
    return map;
  }, {});

  return Promise.all(
    deps.map(async dep => {
      const build = `${dep.dir}/BUILD.bazel`;
      const dependencies = [
        ...new Set([
          ...getDepLabels(root, depMap, dep.meta.dependencies),
          ...getDepLabels(root, depMap, dep.meta.devDependencies),
        ]),
      ];
      if (!await exists(build)) {
        // generate BUILD.bazel file
        const name = dep.meta.name;
        const path = relative(root, dep.dir);
        const rules = await require(`${root}/third_party/jazelle/scripts/bazel-build-file-template.js`).template({
          name,
          path,
          label: `//${path}:${name}`,
          dependencies,
        });
        await write(build, rules.trim(), 'utf8');
      } else {
        // sync web_library deps list in BUILD.bazel with local dependencies in package.json
        let code = await read(build, 'utf8');
        const items = getCallArgItems(code, 'web_library', 'deps');
        dependencies.map(d => `"${d}"`).forEach(dependency => {
          if (!items.includes(dependency)) {
            code = addCallArgItem(code, 'web_library', 'deps', `${dependency}`);
          }
        });
        items.forEach(item => {
          if (!dependencies.map(d => `"${d}"`).includes(item)) {
            const [, path] = item.match(/\/\/(.+?):/);
            if (projects.includes(path)) {
              code = removeCallArgItem(code, 'web_library', 'deps', item);
            }
          }
        });
        await write(build, code, 'utf8');
      }
    })
  );
}

const getDepLabels = (root, depMap, dependencies = {}) => {
  return Object.keys(dependencies)
    .map(name => {
      const {dir} = depMap[name] || {};
      return dir ? `//${relative(root, dir)}:${name}` : null;
    })
    .filter(Boolean);
}

module.exports = {generateBazelBuildRules};