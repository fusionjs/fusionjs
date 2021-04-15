/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser, node */

function persistScriptTags() {
  document.addEventListener(
    'load',
    function onScriptLoadCapture(e /*: Event*/) {
      if (e.target instanceof HTMLScriptElement) {
        // Webpack v5 removes loaded script tags from the page for async chunks
        // But our tests rely on the script tags to be present on the page
        e.target.addEventListener('load', function onScriptLoad(e /*: Event*/) {
          const script /*: HTMLScriptElement*/ = (e.target /*: any*/);
          if (!script.parentNode) {
            delete script.onload;
            delete script.onerror;
            // $FlowFixMe
            document.head.appendChild(script);
          }
        });
      }
    },
    true
  );
}

module.exports = persistScriptTags;
