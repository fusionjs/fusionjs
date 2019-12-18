// @flow
const {read} = require('../utils/node-helpers.js');

/*::
export type PayloadMetadata = {type: string, dir: string, action: string, args: Array<string>}
export type GetTestGroupsArgs = {
  root: string,
  data: Array<string>,
  nodes: number,
};
export type GetTestGroups = (GetTestGroupsArgs) => Promise<Array<Array<PayloadMetadata>>>;
*/
const getTestGroups /*: GetTestGroups */ = async ({root, data, nodes}) => {
  // if no file, fallback to reading from stdin (fd=0)
  const normalized = await normalize(root, data);
  const groups = groupByProject(normalized);
  return distributeGroups(groups, nodes);
};

const normalize = async (root, data) => {
  if (data.length === 0) return [];

  const isBazel = data[0].startsWith('//');
  if (!isBazel) {
    const output = [];
    await Promise.all(
      data.map(async dir => {
        const file = `${root}/${dir}/package.json`;
        const data = await read(file, 'utf8').catch(e => {
          const message = `Invalid bazel target or project folder ${root}/${dir}`;
          throw new Error(message);
        });
        const meta = JSON.parse(data);
        if (meta.scripts) {
          const {test, lint, flow} = meta.scripts;
          if (test) output.push({type: 'dir', dir, action: 'test', args: []});
          if (lint) output.push({type: 'dir', dir, action: 'lint', args: []});
          if (flow) output.push({type: 'dir', dir, action: 'flow', args: []});
        }
      })
    );
    return output;
  } else {
    return data.map(target => {
      const parts = target.split(':');
      const dir = parts[0].slice(2);
      const action = parts[1];
      return {type: 'bazel', dir, action, args: []};
    });
  }
};

const groupByProject = data => {
  const groups = {};
  for (const item of data) {
    const project = getId(item);
    if (!groups[project]) groups[project] = [];
    groups[project].push(item);
  }
  return Object.keys(groups)
    .map(key => groups[key])
    .sort((a, b) => b.length - a.length); // sort biggest first
};
const distributeGroups = (groups, numNodes) => {
  const payloads = [...Array(numNodes)].map(() => []);
  for (const group of groups) {
    getSmallest(payloads).push(...group);
  }

  // if there are empty sets, redistribute items from overloaded sets to underloaded ones
  const underloaded = payloads.filter(payload => payload.length === 0);
  if (underloaded.length > 0) {
    const overloaded = payloads.filter(payload => payload.length > 0);
    let i = 0;
    for (const payload of underloaded) {
      const candidates = overloaded[i % overloaded.length];
      if (!candidates) break;
      if (candidates.length > 1) {
        const candidate = candidates.shift();
        payload.push(candidate);
      }
      i++;
    }
  }
  return payloads
    .filter(payload => payload.length > 0) // remove empty arrays
    .sort((a, b) => {
      return JSON.stringify(a).localeCompare(JSON.stringify(b)); // sort jobs alphabetically
    });
};

const getSmallest = payloads => {
  let smallest = payloads[0];
  for (let i = 0; i < payloads.length; i++) {
    if (payloads[i].length < smallest.length) smallest = payloads[i];
  }
  return smallest;
};

const getId = metadata => {
  return typeof metadata.dir === 'string'
    ? String(metadata.dir)
    : typeof metadata.target === 'string'
    ? String(metadata.target).split(':')[0] || ''
    : '';
};

module.exports = {getTestGroups};
