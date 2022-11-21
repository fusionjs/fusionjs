/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type {Context} from '../types';

const botRegex = /(bot|crawler|spider)/i;

export function isBot(ctx: Context) {
  // Bots don't always include the accept header.
  if (ctx.headers['user-agent']) {
    const agent = ctx.headers['user-agent'];
    if (botRegex.test(agent) && ctx.method === 'GET') {
      return true;
    }
  }
  return false;
}
