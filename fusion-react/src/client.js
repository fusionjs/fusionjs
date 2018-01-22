/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-env browser */
import ReactDOM from 'react-dom';

export default el => {
  const domElement = document.getElementById('root');
  return ReactDOM.hydrate
    ? ReactDOM.hydrate(el, domElement)
    : ReactDOM.render(el, domElement);
};
