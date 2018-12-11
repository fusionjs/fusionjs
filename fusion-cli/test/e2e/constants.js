// @noflow
/* eslint-env node */

const os = require('os');
const path = require('path');

module.exports = {
  wsEndpointFilename: path.join(
    os.tmpdir(),
    'jest_fusion_cli_puppeteer_ws_endpoint'
  ),
};
