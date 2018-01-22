/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-env node */
import {renderToStringWithData} from 'react-apollo';

export default root => {
  return renderToStringWithData(root).then(content => {
    return `<div id='root'>${content}</div>`;
  });
};
