/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import App from 'fusion-react';
import NodePerfEmitterPlugin from '../index';

export default () => {
  const app = new App(React.createElement('div'));
  // We can register NodePerfEmitterPlugin within a node block with no refinements
  if (__NODE__) {
    app.register(NodePerfEmitterPlugin);
  }

  return app;
};
