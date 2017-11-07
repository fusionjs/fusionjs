/* eslint-env node */
const context = require.context('__BROWSER_TEST_ENTRY__', true);
context.keys().map(context);
