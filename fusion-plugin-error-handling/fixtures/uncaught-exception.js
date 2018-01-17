/* eslint-env node */
const Plugin = require('../dist/index.js');

const onError = e => {
  console.log('ERROR HANDLER', e); // eslint-disable-line
};

Plugin({onError});

// keep the process running
setInterval(() => {}, 1000);

throw new Error('FAIL');
