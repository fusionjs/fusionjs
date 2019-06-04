const {check: checkDeps} = require('yarn-utilities');

async function reportMismatchedTopLevelDeps(root, projects, versionPolicy) {
  const reported = await checkDeps({roots: projects.map(p => `${root}/${p}`)});
  if (!versionPolicy) {
    return {
      valid: true,
      policy: {
        lockstep: false,
        exceptions: [],
      },
      reported
    }
  };

  const policy = {
    lockstep: !!versionPolicy.lockstep,
    exceptions: versionPolicy.exceptions || [],
  };
  const exceptions = Object.keys(reported).filter(dep => policy.exceptions.includes(dep));
  const hasExceptions = exceptions.length === 0;
  const valid = policy.lockstep !== hasExceptions;

  return {valid, policy, reported};
}
function getErrorMessage(result) {
  if (!result.valid) {
    console.log(result)
    const policy = result.policy;
    const exceptions = Object.keys(result.reported).filter(dep => policy.exceptions.includes(dep));
    const message = `Version policy violation. Use \`jazelle greenkeep\` to ensure all projects use the same dependency version`;
    const positiveSpecifier = policy.exceptions.length > 0 ? ` for deps other than ${policy.exceptions.join(', ')}` : '';
    const negativeSpecifier = exceptions.length > 0 ? ` for ${exceptions.join(', ')}` : '';
    const modifier = policy.lockstep ? positiveSpecifier : negativeSpecifier;
    return message + modifier;
  }
}

module.exports = {reportMismatchedTopLevelDeps, getErrorMessage};