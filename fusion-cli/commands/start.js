/* eslint-env node */
const fs = require('fs');
const path = require('path');

exports.command = 'start [dir]';
exports.desc = 'Run your app';
exports.builder = {
  // TODO: https://github.com/uber-web/framework/issues/882
  // debug: {
  //   type: 'boolean',
  //   default: false,
  //   describe: 'Debug application',
  // },
  environment: {
    type: 'string',
    describe:
      'Which environment/assets to run - defaults to first available assets among ["development", "test", "production"]',
  },
};

exports.run = async function({dir = '.', environment}) {
  const getEntry = env => {
    const entryPath = `.fusion/dist/${env}/server/server-main.js`;
    return path.resolve(dir, entryPath);
  };

  const env = environment
    ? fs.existsSync(getEntry(environment)) && environment
    : ['development', 'test', 'production'].find(e =>
        fs.existsSync(getEntry(e))
      );

  if (env) {
    const entry = getEntry(env);
    const {start} = require(entry);

    return start({port: process.env.PORT_HTTP || 3000}); // handle server bootstrap errors (e.g. port already in use)
  } else {
    throw new Error(`App can't start. JS isn't compiled`); // handle compilation errors
  }
};
