/* eslint-env node */

const projects = process.env.JEST_ENV.split(',');

let config = {
  cache: false,
  coverageDirectory: `${process.cwd()}/coverage`,
};

// Use projects if we have more than one environment.
if (projects.length > 1) {
  config.projects = projects.map(project => `<rootDir>/${project}`);
} else {
  config = {
    ...require(`./${
      projects[0] === 'jsdom' ? 'jsdom' : 'node'
    }/jest.config.js`),
  };
}

module.exports = config;
