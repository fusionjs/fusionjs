// @flow
const {check: checkDeps} = require('./lockfile.js');

/*::
import type {VersionPolicy, ExceptionMetadata} from './get-manifest.js';

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

  let reportedFilter = Object.keys(reported)
    .filter((dep /*: string */) =>
      policy.lockstep
        ? !policy.exceptions.includes(dep)
        : policy.exceptions.filter(
            // $FlowFixMe
            exception => exception === dep || exception.name === dep
          ).length > 0
    )
    .reduce((obj, dep /*: string */) => {
      const meta /*: ExceptionMetadata */ = (policy.exceptions /*: any */)
        .filter(meta => meta.name === dep)[0];
      if (!meta) {
        // for blanket exemptions, include all reportedly mismatched versions
        obj[dep] = reported[dep];
      } else {
        // otherwise, keep only versions that are not specifically exempt in the version policy
        for (let version of Object.keys(reported[dep])) {
          if (!meta.versions.includes(version)) {
            if (!obj[dep]) obj[dep] = {};
            obj[dep][version] = reported[dep][version];
          }
        }
      }
      return obj;
    }, {});
  const valid = Object.keys(reportedFilter).length === 0;
  return {valid, policy, reported: reportedFilter};
};

/*::
export type GetErrorMessage = (Report, boolean) => string;
*/
const getErrorMessage /*: GetErrorMessage */ = (result, json = false) => {
  if (!result.valid) {
    const policy = result.policy;
    const exceptions = Object.keys(result.reported).filter(dep =>
      policy.exceptions.includes(dep)
    );
    const message = `Version policy violation. Use \`jazelle upgrade\` to ensure all projects use the same dependency version`;
    const positiveSpecifier =
      policy.exceptions.length > 0
        ? ` for deps other than ${policy.exceptions
            .map(exception => exception.name || exception)
            .join(', ')}`
        : '';
    const negativeSpecifier =
      exceptions.length > 0 ? ` for ${exceptions.join(', ')}` : '';
    const modifier = policy.lockstep ? positiveSpecifier : negativeSpecifier;
    const report = JSON.stringify(result.reported, null, 2);
    const violations = `\nViolations:\n${report}`;
    return json ? report : message + modifier + violations;
  } else {
    return json ? '{}' : '';
  }
};

module.exports = {reportMismatchedTopLevelDeps, getErrorMessage};
