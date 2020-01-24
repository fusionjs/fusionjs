/* @flow */
/* eslint-env node */

// Based off https://labs.contactually.com/parallelizing-jest-across-multiple-ci-containers-551e7d3e4cb0

const glob = require('globby');
const {testPathIgnorePatterns} = require('./jest.config.js');

/**
 * writes a list of files matching the glob pattern to stdout
 * runs only the subset of files which fall within the job, set
 * in the environment variables.
 *
 * JOB_COUNT is the number of jobs we will be splitting across, 1-indexed
 * JOB_INDEX is the index of the job (subset of files) we should be running, 0-indexed
 */
const {JOB_COUNT = 1, JOB_INDEX = 0} /*: any */ = process.env;

/**
 * gets a list of files matching the given glob
 * @returns {string}
 */
function getFiles() /*: Array<string> */ {
  const allFiles = glob.sync(
    [
      '**/test.js',
      '**/*.spec.js',
      '**/*.test.js',
      ...testPathIgnorePatterns.map(pattern => `!${pattern}`),
    ],
    {
      gitignore: true,
      ignore: ['node_modules'],
    }
  );

  const filesPerJob = Math.floor(allFiles.length / JOB_COUNT);
  const startIndex = filesPerJob * JOB_INDEX;
  if (JOB_INDEX == JOB_COUNT - 1) {
    return allFiles.slice(startIndex);
  } else {
    return allFiles.slice(startIndex, startIndex + filesPerJob);
  }
}

const files = getFiles();

/**
 * Join the array of files is into a single string,
 * a new glob pattern which will match all of the
 * selected files, exclusively.
 */
process.stdout.write(files.map(str => '.*/' + str).join('|'));
