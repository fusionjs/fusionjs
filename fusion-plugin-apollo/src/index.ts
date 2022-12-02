/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type {DocumentNode} from 'graphql';
import ApolloRenderEnhancer from './plugin';

export * from './tokens';
export * from './apollo-client/index';

export {ApolloRenderEnhancer};

export function gql(path: string): DocumentNode {
  throw new Error('fusion-plugin-apollo/gql should be replaced at build time');
}
