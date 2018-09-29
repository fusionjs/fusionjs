/*::
declare var __webpack_public_path__: string;
*/

// eslint-disable-next-line
__webpack_public_path__ = window.__FUSION_ASSET_PATH__;

// Require is used and assigned to an identifier to opt out of webpack tree-shaking of ununsed imports
// See: https://github.com/webpack/webpack/issues/6571
let some_identifier = require('core-js'); // eslint-disable-line
