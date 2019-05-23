/** Copyright (c) 2019 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {execSync} = require('child_process');
const {githubGraphql} = require('./_utils.js');

const {
  // not populated for pull requests because of ci-gate
  BUILDKITE_BRANCH,
  // format: Pull Request #[number] - [sha]
  BUILDKITE_MESSAGE,
  // format: ssh remote url
  BUILDKITE_REPO,
  GH_EMAIL,
  GH_TOKEN,
  GH_USERNAME,
} = process.env;

async function getRepoInfo() {
  let fullRepoName = BUILDKITE_REPO.replace(/^git@github\.com:|\.git$/g, '');
  const [repoOwner, repoName] = fullRepoName.split('/');
  let branchName;

  if (BUILDKITE_BRANCH === 'master') {
    branchName = BUILDKITE_BRANCH;
  } else {
    const [, pullRequestNumber] =
      /^Pull request #(\d+)/i.exec(BUILDKITE_MESSAGE) || [];
    // this might fail if PR uses a fork and `maintainersCanModify` is false
    const pullRequest = await githubGraphql({
      token: GH_TOKEN,
      query: `query($owner: String!, $name: String!, $number: Int!) {
        repository(owner: $owner, name: $name) {
          pullRequest(number: $number) {
            headRefName
            headRepository {
              nameWithOwner
            }
          }
        }
      }`,
      variables: {
        owner: repoOwner,
        name: repoName,
        number: parseInt(pullRequestNumber),
      },
    }).then(res => {
      if (res.repository && res.repository.pullRequest) {
        return res.repository.pullRequest;
      }
    });

    if (pullRequest) {
      branchName = pullRequest.headRefName;
      // needs to re-defined this in case PR was made with a fork
      fullRepoName = (pullRequest.headRepository || {}).nameWithOwner;
    }
  }

  if (!branchName || !fullRepoName) {
    throw new Error(`Can't configure git; unable to get repo info`);
  }

  return {
    branchName,
    remoteUrl: `https://${GH_USERNAME}:${GH_TOKEN}@github.com/${fullRepoName}.git`,
  };
}

if (
  BUILDKITE_REPO &&
  (BUILDKITE_BRANCH || BUILDKITE_MESSAGE) &&
  GH_EMAIL &&
  GH_TOKEN &&
  GH_USERNAME
) {
  getRepoInfo()
    .then(({branchName, remoteUrl}) =>
      execSync(
        [
          `git config user.email ${GH_EMAIL}`,
          `git config user.name ${GH_USERNAME}`,
          // git is authenticated with github token via basic auth in remote url
          `git remote remove origin`,
          `git remote add origin ${remoteUrl}`,
          `git checkout -b ${branchName}`,
          `git branch --set-upstream-to origin/${branchName}`,
        ].join(' && '),
        {stdio: 'inherit'}
      )
    )
    .catch(console.error);
} else {
  console.error(`Can't configure git; required environment vars missing`);
}
