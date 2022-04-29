/* eslint-env node */
// @flow
const path = require('path');

/* ::
type Options = {
  dir?: string,
  env?: 'development' | 'production',
  useModuleScripts?: boolean
};
*/

module.exports = (args /*: ?Options */) => {
  const {
    dir = process.cwd(),
    env = 'production',
    useModuleScripts = false,
  } = args || {};
  // $FlowFixMe
  const getHandler = require(path.join(
    dir,
    `.fusion/dist/${env}/server/server-main.js`
  )).default;
  const handlerPromise = getHandler(dir, {useModuleScripts});
  return (req /*: any */, res /*: any */) => {
    return handlerPromise.then((h) => {
      return h(req, res);
    });
  };
};
