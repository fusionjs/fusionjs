// @flow

/*::
export type AbsoluteUrlToRelative = (string) => string
*/
const absoluteUrlToRelative /*: AbsoluteUrlToRelative */ = url => {
  return url.replace(/^https?:\/\/.*?\/(.+)$/, '/$1');
};
module.exports = {absoluteUrlToRelative};
