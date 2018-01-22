/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow
import Plugin from './plugin/plugin';
import SingletonPlugin from './singleton-plugin/singleton-plugin';
import compose from './compose';

export type PluginType<A> = {
  of(ctx: ?Object): A,
};
export {Plugin, SingletonPlugin, compose};
