/* eslint-env node */
const fs = require('fs');
const path = require('path');

exports.command = 'start [--dir] [--environment]';
exports.desc = 'Run your app';
exports.builder = {
  // TODO(#20) ensure --debug works with start and test commands
  // debug: {
  //   type: 'boolean',
  //   default: false,
  //   describe: 'Debug application',
  // },
  dir: {
    type: 'string',
    default: '.',
    describe: 'Root path for the application relative to CLI CWD',
  },
  environment: {
    type: 'string',
    describe:
      'Which environment/assets to run - defaults to first available assets among ["development", "production"]',
  },
};

exports.run = async function({dir = '.', environment}) {
  const getEntry = env => {
    const entryPath = `.fusion/dist/${env}/server/server-main.js`;
    return path.resolve(dir, entryPath);
  };

  const env = environment
    ? fs.existsSync(getEntry(environment)) && environment
    : ['development', 'production'].find(e => fs.existsSync(getEntry(e)));

  if (env) {
    const entry = getEntry(env);
    const {start} = require(entry);

    return start({port: process.env.PORT_HTTP || 3000}); // handle server bootstrap errors (e.g. port already in use)
  } else {
    throw new Error(`App can't start. JS isn't compiled`); // handle compilation errors
  }
};
