/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const stripIndent = require('strip-indent');

module.exports = () =>
  stripIndent(
    `import { chunkId as _chunkId } from 'fusion-core';

const _CHUNKIDS_ID = _chunkId('/fake-file.js');

import _singleton from 'fusion-plugin-i18n-react/singleton';

_singleton.add('/fake-file.js', _CHUNKIDS_ID, _translations);

if (module.hot) {
  module.hot.dispose(() => {
    _singleton.dispose('/fake-file.js', _CHUNKIDS_ID, _translations);
  });
}
`
  ).trim();
