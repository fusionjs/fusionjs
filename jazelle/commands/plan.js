// @flow
const {read} = require('../utils/node-helpers.js');
const {getTestGroups} = require('../utils/get-test-groups.js');

/*::
type PlanArgs = {
  root: string,
  targets?: string,
  nodes?: string,
};
type Plan = (PlanArgs) => Promise<void>;
*/
const plan /*: Plan */ = async ({root, targets, nodes}) => {
  // if no file, fallback to reading from stdin (fd=0)
  const data = await read(targets || 0, 'utf8').catch(() => '');
  const numNodes = parseInt(nodes, 10) || 1;
  const payloads = await getTestGroups({
    root,
    data: data
      .split('\n')
      .map(item => item.trim())
      .filter(Boolean),
    nodes: numNodes,
  });
  console.log(JSON.stringify(payloads, null, 2));
};

module.exports = {plan};
