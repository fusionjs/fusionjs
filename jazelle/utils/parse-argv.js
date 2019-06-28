// @flow

/*::
export type Parse = (Array<string>) => Args;
export type Args = {[string]: string};
*/
const parse /*: Parse */ = args => {
  const params = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      if (args[i + 1] == null || args[i + 1].startsWith('--')) {
        params[args[i].slice(2)] = true;
      } else {
        params[args[i].slice(2)] = args[i++ + 1];
      }
    } else {
      params.name = args[i];
    }
  }
  return params;
};

module.exports = {parse};
