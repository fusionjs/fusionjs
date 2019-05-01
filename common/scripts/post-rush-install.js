const {readdirSync, symlinkSync} = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');

function fixSymlinks() {
  try {
    symlinkSync(
      path.resolve(ROOT_DIR, 'fusion-cli/bin/cli.js'),
      path.resolve(ROOT_DIR, 'create-fusion-app/node_modules/.bin/fusion')
    );
  } catch (e) {}

  try {
    symlinkSync(
      path.resolve(ROOT_DIR, 'fusion-cli/bin/cli.js'),
      path.resolve(ROOT_DIR, 'fusion-apollo-universal-client/node_modules/.bin/fusion')
    );
  } catch (e) {}
}

function verifyLinks() {
  const deps = readdirSync(path.resolve(ROOT_DIR, 'common/temp/node_modules'));
  const problems = deps.filter(dep => dep.match(/fusion-/));

  if (problems.length > 0) {
    const redOpen = '\u001b[31m';
    const redClose = '\u001b[39m';

    console.error(`${redOpen}Fusion packages should not be hoisted to the monorepo node_modules! Problematic packages are:\n\n${problems.join('\n')}${redClose}`);
    process.exit(1);
  }
}

fixSymlinks();
verifyLinks();
