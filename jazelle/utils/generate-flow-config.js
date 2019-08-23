// @flow
const {relative} = require('path');
const {read, exists, write} = require('./node-helpers.js');

const customConfigName = '.flowconfig_monorepo';

/**
 * Generates a new .flowconfig file based upon an existing one found in
 * the provided directory path.  Returns the name of the new file.
 *
 * Changes include:
 *   - Updating [include] to point to ${root}/node_modules/
 */
/*::
type GenerateFlowConfigArgs = {
  root: string,
  dir: string
}
type GenerateFlowConfig = (GenerateFlowConfigArgs) => Promise<Array<string>>;
*/
const generateFlowConfig /*: GenerateFlowConfig */ = async ({root, dir}) => {
  const configFile = `${dir}/.flowconfig`;
  if (await exists(configFile)) {
    const flowconfig = await read(configFile, 'utf-8');

    // Parse .flowconfig custom format and append additional entry to [include]
    const lines = flowconfig.split('\n');
    const includesHeaderIndex = lines.indexOf('[include]');
    const headerIndex =
      includesHeaderIndex > -1 ? includesHeaderIndex : lines.push('[include]');
    lines.splice(headerIndex + 1, 0, relative(root, `${dir}/node_modules`));

    await write(`${dir}/${customConfigName}`, lines.join('\n'), 'utf8');
    return ['--flowconfig-name', customConfigName];
  }
  return [];
};

module.exports = {generateFlowConfig};
