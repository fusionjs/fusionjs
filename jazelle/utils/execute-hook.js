// @flow
const {dirname} = require('path');
const {node} = require('./binary-paths.js');
const {exec} = require('./node-helpers.js');

/*::
type ExecuteHook = (?string, string) => Promise<void>;
*/
const executeHook /*: ExecuteHook */ = async (hook, root) => {
  const nodePath = dirname(node);
  if (typeof hook === 'string') {
    // prioritize hermetic Node version over system version
    const options = {
      env: {...process.env, PATH: `${nodePath}:${String(process.env.PATH)}`},
      cwd: root,
    };
    const stdio = [process.stdout, process.stderr];
    await exec(hook, options, stdio);
  }
};

module.exports = {executeHook};
