/* eslint-env node */
const stripIndent = require('strip-indent');
const sharedExpectedContent = stripIndent(
  `
    import { chunkId as _chunkId } from 'fusion-core';

    const _CHUNKIDS_ID = _chunkId('fake-file.js');

    import { nodeSingleton as _singleton } from 'fusion-experimentation';

    _singleton.add('fake-file.js', _CHUNKIDS_ID, _experimentation);

    if (module.hot) {
      module.hot.dispose(() => {
        _singleton.dispose('fake-file.js', _CHUNKIDS_ID, _experimentation);
      });
    }
`
).trim();

module.exports = function getExpected(inputString, includeShared = true) {
  const sharedContent = includeShared ? '\n' + sharedExpectedContent : '';
  return (stripIndent(inputString).trim() + sharedContent).replace(/"/g, "'");
};
