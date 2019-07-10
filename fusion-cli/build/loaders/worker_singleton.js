// @flow
/* eslint-env node */
const Worker = require('jest-worker').default;

const worker = new Worker(require.resolve('./babel-worker.js'), {
  computeWorkerKey: filename => filename,
  exposedMethods: ['runTransformation'],
  forkOptions: {stdio: 'inherit'},
});

module.exports = {
  worker,
  killWorker,
};

function killWorker() {
  worker.end();
}
