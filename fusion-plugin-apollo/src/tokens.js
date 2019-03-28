/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import React from 'react';
import {createToken, type Context, type Token} from 'fusion-core';
import type {ApolloClient} from 'apollo-client';

export type InitApolloClientType<TInitialState> = (
  ctx: Context,
  initialState: TInitialState
) => ApolloClient<TInitialState>;

// We should have better flow types for the schema
export const GraphQLSchemaToken: Token<any> = createToken('GraphQlSchemaToken');

export type ApolloContext<T> = Context => T | T;

export const ApolloContextToken: Token<ApolloContext<mixed>> = createToken(
  'ApolloContextToken'
);

export const ApolloCacheContext = React.createContext<
  $PropertyType<InitApolloClientType<mixed>, 'cache'>
>();

export const GraphQLEndpointToken: Token<string> = createToken(
  'GraphQLEndpointToken'
);

export const ApolloClientToken: Token<
  InitApolloClientType<mixed>
> = createToken('ApolloClientToken');
