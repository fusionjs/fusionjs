/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

exports.run = async function profileHandler() {
  console.warn(
    '`fusion profile` command is deprecated. You can use `--analyze` option with `build` or `dev` command instead'
  );
};
