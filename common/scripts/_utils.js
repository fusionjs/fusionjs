/** Copyright (c) 2019 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * dependency-free network request
 * @param {string} url
 * @param {object} opts
 * @param {object} opts.body
 * @param {object} opts.headers
 * @param {string} opts.method
 */
async function request(url, opts = {}) {
  opts.method = opts.method || 'GET';
  let body;

  if (opts.method === 'POST') {
    body = opts.body;
    delete opts.body;
  }

  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? require('https') : require('http');
    const req = lib.request(url, opts, res => {
      if (res.statusCode < 200 || res.statusCode > 299) {
        reject(new Error(res.statusCode));
      }

      const body = [];

      res.on('data', chunk => body.push(chunk.toString()));
      res.on('end', () => resolve(JSON.parse(body.join(''))));
    });

    if (body) {
      req.write(body);
    }

    req.on('error', err => reject(err));
    req.end();
  });
}

/**
 * @param {object} opts
 * @param {string} opts.query
 * @param {string} opts.token
 * @param {string} opts.variables
 */
async function githubGraphql(opts = {}) {
  const res = await request('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${opts.token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'fusionjs buildkite',
    },
    body: JSON.stringify({
      query: opts.query.replace(/\n/g, ''),
      variables: JSON.stringify(opts.variables || {}),
    }),
  });

  if (res.errors) {
    throw new Error(res.errors[0].message);
  }

  return res.data;
}

module.exports = {
  githubGraphql,
  request,
};
