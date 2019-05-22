/** Copyright (c) 2019 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {execSync} = require('child_process');
const path = require('path');

const {BUILDKITE_MESSAGE} = process.env;
const RUSH_CMD = `node ${path.join(__dirname, 'install-run-rush.js')}`;

if (BUILDKITE_MESSAGE.includes('Pull request')) {
  console.log('Attempting `rush install`...');

  try {
    const res = execSync(`${RUSH_CMD} install`, {encoding: 'utf-8'});
    // can't inherit stdio because then it wouldn't be available
    // as `error.stdout` if it fails
    console.log(res);
  } catch (error) {
    if (
      error.stdout.includes('The shrinkwrap file (yarn.lock) is out of date.')
    ) {
      console.log('Lockfile out of date; running `rush update --full --purge`');
      execSync(
        [
          `${RUSH_CMD} update --full --purge`,
          `git add common/config/rush/yarn.lock`,
          `git commit -m 'Update lockfile'`,
          `git push`,
        ].join(' && '),
        {stdio: 'inherit'}
      );
    } else {
      console.error(error.stdout);
    }

    process.exit(1);
  }
} else {
  execSync(`${RUSH_CMD} install`, {stdio: 'inherit'});
}
