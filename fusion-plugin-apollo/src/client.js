/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-env browser */
import ReactDOM from 'react-dom';

export default root => {
  const domElement = document.getElementById('root');
  ReactDOM.hydrate
    ? ReactDOM.hydrate(root, domElement)
    : ReactDOM.render(root, domElement);
};
