const {readFile} = require('fs');
const {promisify} = require('util');
const {satisfies} = require('semver');

const read = promisify(readFile);

module.exports.getLocalDependencies = async ({dirs, target}) => {
  const data = await Promise.all([
    ...dirs.map(async dir => {
      const meta = JSON.parse(await read(`${dir}/package.json`, 'utf8'));
      return {dir, meta};
    }),
  ]);
  return unique(findDependencies(data, target));
}

function findDependencies(data, target) {
  const output = [];
  const item = data.find(item => item.dir === target);
  if (item) {
    const fields = ['dependencies', 'devDependencies'];
    for (const field of fields) {
      const deps = item.meta[field] || {};
      Object.keys(deps).forEach(dep => {
        const found = data.find(item => {
          return item.meta.name === dep && satisfies(item.meta.version, deps[dep])
        });
        if (found) output.push(...findDependencies(data, found.dir), found);
      });
    }
    output.push(item);
  }
  return output;
}

function unique(data) {
  const map = new Map();
  for (const item of data) {
    map.set(item.dir, item);
  }
  return [...map.values()];
}