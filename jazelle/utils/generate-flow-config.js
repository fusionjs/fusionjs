// @flow

const {readFile, exists, writeFile} = require('fs');
const {promisify} = require('util');

const readAsync = promisify(readFile);
const existsAsync = promisify(exists);
const writeAsync = promisify(writeFile);

const CUSTOM_CONFIG_NAME = '.flowconfig_monorepo';

/**
 * Generates a new .flowconfig file based upon an existing one found in
 * the provided directory path.  Returns the name of the new file.
 *
 * Changes include:
 *   - Updating [include] to point to ../../third_party/jazelle/temp/node_modules/
 */
async function generate(dir /*: string */) /*: Promise<?string> */ {
  const configFile = `${dir}/.flowconfig`;
  if (await existsAsync(configFile)) {
    const flowconfig = await readAsync(configFile, 'utf-8');

    // Parse .flowconfig custom format and append additional entry to [include]
    const lines = flowconfig.split('\n');
    const includesHeaderIndex = lines.indexOf('[include]');
    const headerIndex =
      includesHeaderIndex > -1 ? includesHeaderIndex : lines.push('[include]');
    lines.splice(
      headerIndex + 1,
      0,
      '../../third_party/jazelle/temp/node_modules/'
    );

    await writeAsync(`${dir}/${CUSTOM_CONFIG_NAME}`, lines.join('\n'), 'utf8');
    return CUSTOM_CONFIG_NAME;
  }
}

module.exports = generate;
