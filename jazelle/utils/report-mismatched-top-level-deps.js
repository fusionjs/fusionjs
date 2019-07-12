// @flow
const {check: checkDeps} = require('yarn-utilities');

/*::
import type {VersionPolicy} from './get-manifest.js';

export type ReportMismatchedTopLevelDepsArgs = {
  root: string,
  projects: Array<string>,
  versionPolicy: VersionPolicy | void,
}
export type ReportMismatchedTopLevelDeps = (ReportMismatchedTopLevelDepsArgs) => Promise<Report>;
export type Report = {
  valid: boolean,
  policy: VersionPolicy,
  reported: DependencyReport,
};
export type DependencyReport = {
  [string]: {
    [string]: Array<string>,
  },
};
*/
const reportMismatchedTopLevelDeps /*: ReportMismatchedTopLevelDeps */ = async ({
  root,
  projects,
  versionPolicy,
}) => {
  const reported = await checkDeps({roots: projects.map(p => `${root}/${p}`)});
  if (!versionPolicy) {
    return {
      valid: true,
      policy: {
        lockstep: false,
        exceptions: [],
      },
      reported,
    };
  }

  const policy = {
    lockstep: !!versionPolicy.lockstep,
    exceptions: versionPolicy.exceptions || [],
  };
  const exceptions = Object.keys(reported).filter(dep =>
    policy.exceptions.includes(dep)
  );

  if (policy.lockstep) {
    const reportedFilter = Object.keys(reported)
      .filter(key => !policy.exceptions.includes(key))
      .reduce((obj, key) => {
        obj[key] = reported[key];
        return obj;
      }, {});
    const valid = Object.keys(reportedFilter).length === 0;

    return {valid, policy, reported: reportedFilter};
  } else {
    const valid = exceptions.length === Object.keys(reported);
    return {valid, policy, reported};
  }
};

/*::
export type GetErrorMessage = (Report) => string;
*/
const getErrorMessage /*: GetErrorMessage */ = result => {
  if (!result.valid) {
    const policy = result.policy;
    const exceptions = Object.keys(result.reported).filter(dep =>
      policy.exceptions.includes(dep)
    );
    const message = `Version policy violation. Use \`jazelle greenkeep\` to ensure all projects use the same dependency version`;
    const positiveSpecifier =
      policy.exceptions.length > 0
        ? ` for deps other than ${policy.exceptions.join(', ')}`
        : '';
    const negativeSpecifier =
      exceptions.length > 0 ? ` for ${exceptions.join(', ')}` : '';
    const modifier = policy.lockstep ? positiveSpecifier : negativeSpecifier;
    const violations = `\nViolations:\n${Object.keys(result.reported)
      .map(dep => `${dep}: ${Object.keys(result.reported[dep]).join(', ')}`)
      .join('\n')}`;
    return message + modifier + violations;
  } else {
    return '';
  }
};

module.exports = {reportMismatchedTopLevelDeps, getErrorMessage};
