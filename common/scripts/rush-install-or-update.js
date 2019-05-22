/** Copyright (c) 2019 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {execSync} = require('child_process');
const path = require('path');

const {
  BUILDKITE_MESSAGE,
  BUILDKITE_REPO,
  GH_EMAIL,
  GH_TOKEN,
  GH_USERNAME,
} = process.env;
const RUSH_CMD = `node ${path.join(__dirname, 'install-run-rush.js')}`;

function configureGit() {
  const repoName = BUILDKITE_REPO.replace(/^git@github\.com:|\.git$/, '');
  const remote = `https://${GH_USERNAME}:${GH_TOKEN}@github.com/${repoName}.git`;

  return execSync([
    `git config user.email ${GH_EMAIL}`,
    `git config user.name ${GH_USERNAME}`,
    // remote is replaced so we can authenticate git with a github token
    `git remote remove origin`,
    `git remote add origin ${remote}`,
  ].join(' && '), {stdio: 'inherit'});
}

if (BUILDKITE_MESSAGE.includes('Pull request')) {
  console.log('Attempting `rush install`...');

  try {
    const res = execSync(`${RUSH_CMD} install`, {encoding: 'utf-8'});
    console.log(res);
  } catch (error) {
    if (error.stdout.includes('The shrinkwrap file (yarn.lock) is out of date.')) {
      console.log('Lockfile out of date; running `rush update --full --purge`');

      configureGit();
      execSync([
        `${RUSH_CMD} update --full --purge`,
        `git checkout -b test-update`,
        `git add common/config/rush/yarn.lock`,
        `git commit -m 'Update lockfile'`,
        `git push origin2 test-update`,
      ].join(' && '), {stdio: 'inherit'});
    } else {
      // stdout because it seems like rush doesn't use stderr
      console.error(error.stdout);
    }

    process.exit(1);
  }
} else {
  execSync(`node ${rushPath} install`, {stdio: 'inherit'});
}
