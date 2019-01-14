/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */
import {renderToStringWithData} from 'react-apollo';
import {renderToString} from 'react-dom/server';
import type {Logger} from 'fusion-tokens';

import type {Element} from 'react';

// Apollo currently does not have an effective error policy for server side rendering (see https://github.com/apollographql/react-apollo/issues/2680)
// This render function first tries to use `renderToStringWithData`. If any query in this render function fails, we will catch the error, log it, and
// fall back to a standard renderToString, which will set the `loading` props of all queries which failed to execute in the first pass to true.
// This allows us to still render with data in the happy case, and defer to client side rendering if any queries fail. This also acts as a form
// of retrying from the browser.
export default (root: Element<*>, logger?: Logger) => {
  return renderToStringWithData(root)
    .catch(e => {
      logger && logger.error('SSR Failed with Error', e);
      return renderToString(root);
    })
    .then(content => {
      return `<div id='root'>${content}</div>`;
    });
};
