/* eslint-env node */
const fs = require('fs');

// Jest writes coverage after the process exits
// so we need to poll and wait for all coverage files.
const waitForAllCoverage = config => {
  const maxTries = 10000;
  let numTries = 0;
  return Promise.all(
    config.environments.map(
      env =>
        new Promise((resolve, reject) => {
          const interval = setInterval(() => {
            const coverageExists = fs.existsSync(
              `${config.dir}/coverage-${env}/coverage-final.json`
            );
            numTries += 1;
            if (coverageExists) {
              clearInterval(interval);
              resolve();
            } else if (numTries > maxTries) {
              clearInterval(interval);
              reject();
            }
          }, 100);
        })
    )
  );
};

module.exports = function(config) {
  return waitForAllCoverage(config).then(() => {
    const createReporter = require('istanbul-api').createReporter;
    const istanbulCoverage = require('istanbul-lib-coverage');

    const map = istanbulCoverage.createCoverageMap();
    const reporter = createReporter();

    config.environments.forEach(env => {
      const coverage = require(`${
        config.dir
      }/coverage-${env}/coverage-final.json`);
      Object.keys(coverage).forEach(filename =>
        map.addFileCoverage(coverage[filename])
      );
    });

    reporter.dir = `${config.dir}/coverage`;
    reporter.addAll(['json', 'lcov', 'text', 'cobertura']);
    reporter.write(map);
  });
};
