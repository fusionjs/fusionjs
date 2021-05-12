/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */
const path = require('path');
const {readFileSync} = require('fs');
const {codeFrameColumns} = require('@babel/code-frame');
const AnsiToHtml = require('ansi-to-html');
const chalk = require('chalk');

function parseCodeFrame(error /*: Error */) {
  const stackLines = (error.stack || '').split('\n');
  const secondLine = stackLines.length > 1 ? stackLines[1] : '';
  const match = secondLine.match(/at (.+) \((.+):(\d+):(\d+)\)/);
  const [, functionName, file, line, column] = match || [];
  if (!(line && column && file)) {
    return {};
  }
  let fileContents;
  try {
    fileContents = readFileSync(file, 'utf-8');
  } catch (e) {
    // Errors could originate in node internals that do not exist in filesystem
    return {};
  }
  const srcLines = fileContents.split('\n');
  const errorLineNumber = parseInt(line) - 1;
  if (srcLines.length <= errorLineNumber) {
    // This may happen if sourcemaps reference the wrong file
    return {};
  }
  const whitespace = (srcLines[errorLineNumber] || '').search(/\S/);
  const padding = whitespace === -1 ? 0 : whitespace;
  const codeFrame = codeFrameColumns(
    fileContents,
    {
      start: {
        line: parseInt(line),
        column: parseInt(column) + padding,
      },
    },
    {
      highlightCode: true,
      linesAbove: 2,
      linesBelow: 2,
      message: error.message,
    }
  );
  return {
    codeFrame,
    file,
    line,
    column,
    functionName,
  };
}

function renderTerminalError(error /*: Error */) {
  const {codeFrame, file, line, column} = parseCodeFrame(error);
  if (!file) {
    return chalk.red(error.stack);
  }
  const location = chalk.blue(
    `${path.relative(process.cwd(), file)} ${line}:${column}`
  );
  return [location, codeFrame, '', chalk.red(error.stack)].join('\n');
}

module.exports.renderTerminalError = renderTerminalError;

function renderHtmlError(error /*: any */ = {}) {
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
  const {codeFrame, file, line, column, functionName} = parseCodeFrame(error);
  let displayCodeFrame;
  if (file) {
    const ansi = new AnsiToHtml({fg: '#ccc'});
    const htmlCodeFrame = ansi.toHtml(codeFrame);
    const relativeFile = path.relative(process.cwd(), file);
    displayCodeFrame = `
      <p>
        <b>${escapeHtml(functionName)}</b>
        <br>
        <span style="color:rgb(100, 149, 237);">${relativeFile} ${line}:${column}</span>
      </p>
      <pre style="background-color: #111;padding: 0 5px;white-space:break-spaces;">${htmlCodeFrame}</pre>
    `;
  }
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Server error</title>
        <style>
          html {
            background-color: #222;
            color: white;
            line-height: 2;
            font-family: monospace;
          }
          a { color: white; }
          @media (prefers-color-scheme: light) {
            html {
              background-color: rgb(240, 233, 231);
              color: rgb(47, 79, 79);
            }
            a { color: rgb(47, 79, 79); }
          }
        </style>
      </head>
      <body>
        <div style="width:1200px;margin:20px auto;">
          <h1 style="color:rgb(232,59,70);font-size:large;">${
            displayError.message
          }</h1>
          ${displayCodeFrame ? displayCodeFrame : ''}
          <pre style="white-space:break-spaces;">${escapeHtml(
            displayError.stack
          )}</pre>
          <p>
          ${
            link
              ? `<br>For help with this error, visit <a target="_blank" href="${link}">this troubleshooting document</a>`
              : ''
          }
          </p>
        <div>
      </body>
    </html>
  `;
}

module.exports.renderHtmlError = renderHtmlError;

function escapeHtml(str = '') {
  return (str || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
