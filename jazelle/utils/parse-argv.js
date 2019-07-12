// @flow

/*::
export type Parse = (Array<string>) => Args;
export type Args = {[string]: string};
*/
const parse /*: Parse */ = args => {
  const params = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      if (args[i].includes('=')) {
        const [key, ...values] = args[i].split('=');
        if (!params[key.slice(2)]) params[key.slice(2)] = values.join('=');
      } else if (args[i + 1] == null || args[i + 1].startsWith('--')) {
        if (!params[args[i].slice(2)]) params[args[i].slice(2)] = true;
      } else {
        if (!params[args[i].slice(2)]) params[args[i].slice(2)] = args[i++ + 1];
      }
    } else {
      if (!params.name) params.name = args[i];
    }
  }
  return params;
};

/*::
export type GetPassThroughArgs = (Array<string>) => Array<string>
*/
const getPassThroughArgs /*: GetPassThroughArgs */ = args => {
  const rest = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--cwd') i++;
    else rest.push(args[i]);
  }
  return rest;
};

module.exports = {parse, getPassThroughArgs};
