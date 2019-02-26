const {symlinkSync: link} = require('fs');

try {
  link(
    `${__dirname}/../fusion-cli/bin/cli.js`,
    `${__dirname}/../create-fusion-app/node_modules/.bin/fusion`
  );
} catch (e) {}

try {
  link(
    `${__dirname}/../fusion-cli/bin/cli.js`,
    `${__dirname}/../fusion-apollo-universal-client/node_modules/.bin/fusion`
  );
} catch (e) {}
