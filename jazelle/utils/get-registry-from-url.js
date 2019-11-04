// @flow

/*::
export type GetRegistryFromUrl = (string) => string
*/
const getRegistryFromUrl /*: GetRegistryFromUrl */ = url => {
  const match = url.match(/^https?:\/\/(.*?)\//);
  if (Array.isArray(match)) {
    return match[1];
  }
  return url;
};
module.exports = {getRegistryFromUrl};
