/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

function renderError(error /*: any */ = {}) {
  let displayError;
  let {link} = error;
  if (error instanceof Error) {
    displayError = error;
  } else if (typeof error === 'string') {
    displayError = new Error(error);
  } else {
    displayError = new Error(error.message);
    displayError.stack = error.stack;
    displayError.name = error.name;
  }
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Server error</title>
        <style>html {background:red;color:white;line-height:2;}</style>
      </head>
      <body>
        <pre>${(displayError.stack || '').replace(/\[\d\dm/gm, '')}</pre>
        <pre>
        ${link &&
          `<br>For help with this error, visit <a style="color:white;" target="_blank" href="${link}">this troubleshooting document</a>`}
        </pre>
      </body>
    </html>
  `;
}

module.exports.renderError = renderError;
