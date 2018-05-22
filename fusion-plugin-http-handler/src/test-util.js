/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import http from 'http';
import _request from 'request-promise';
import getPort from 'get-port';

export async function startServer(handler: any) {
  const port = await getPort();
  const server = http.createServer(handler);
  await new Promise(resolve => {
    server.listen(port, resolve);
  });
  return {
    server,
    request: (url: string, options: mixed) => {
      return _request(`http://localhost:${port}${url}`, options);
    },
  };
}
