/* eslint-env node */
const App = require('fusion-core').default;
// eslint-disable-next-line import/no-unresolved
const {default: Plugin, ErrorHandlerToken} = require('../dist/index.js');

const onError = e => {
  console.log('ERROR HANDLER', e); // eslint-disable-line
};

const app = new App('el', el => el);

app.register(Plugin);
app.register(ErrorHandlerToken, onError);
app.resolve();

// keep the process running
setInterval(() => {}, 1000);

Promise.reject(new Error('FAIL'));
