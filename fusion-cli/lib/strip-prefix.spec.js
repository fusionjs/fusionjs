/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const t = require('assert');
const http = require('http');
const getPort = require('get-port');
const request = require('request-promise');

const stripRoutePrefix = require('./strip-prefix.js');

test('route prefix stripping', async () => {
  const port = await getPort();
  const expectedUrls = ['/test', '/', '/', '/', '/'];
  const server = http.createServer((req, res) => {
    stripRoutePrefix(req, '/prefix');
    t.equal(req.url, expectedUrls.shift());
    res.end('OK');
  });
  const connection = server.listen(port);
  await request(`http://localhost:${port}/prefix/test`);
  await request(`http://localhost:${port}/prefix/`);
  await request(`http://localhost:${port}/prefix`);
  await request(`http://localhost:${port}/`);
  await request(`http://localhost:${port}`);
  connection.close();
});
