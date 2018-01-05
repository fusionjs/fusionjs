/* eslint-env node */
const React = require('react');
const RedBox = require('redbox-react').RedBoxError;
const ReactDOMServer = require('react-dom/server');

function renderError(res, error) {
  res.write(
    '<!DOCTYPE html><html><head><title>Server error</title></head><body>'
  );

  const displayError = typeof error === 'string' ? new Error(error) : error;
  const errorComponent = ReactDOMServer.renderToString(
    React.createElement(RedBox, {error: displayError})
  );
  res.write(errorComponent);

  res.write('</body></html>');
  res.end();
}

module.exports.renderError = renderError;
