/* eslint-env node */
const Plugin = require('../dist/node.cjs');

const onError = e => {
  console.log('ERROR HANDLER', e); // eslint-disable-line
};

Plugin({onError});

// keep the process running
setInterval(() => {}, 1000);

Promise.reject(new Error('FAIL'));
