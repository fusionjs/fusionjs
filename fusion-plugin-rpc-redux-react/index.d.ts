/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {RPCDepsType, RPCType} from 'fusion-plugin-rpc';
export {
  BodyParserOptionsToken,
  RPCHandlersToken,
  RPCToken,
  ResponseError,
} from 'fusion-plugin-rpc';
export {ActionType, createRPCReducer} from 'fusion-rpc-redux';
import * as React from 'react';
import {Reducer} from 'redux';
import * as fusion_core from 'fusion-core';

declare type RPCReducersType = {
  start?: Reducer<any, any>;
  success?: Reducer<any, any>;
  failure?: Reducer<any, any>;
};
declare function withRPCReactor<Props extends {}>(
  rpcId: string,
  reducers: RPCReducersType,
  {
    propName,
    transformParams,
    mapStateToParams,
  }?: {
    propName?: string;
    transformParams?: (params: any) => any;
    mapStateToParams?: (state: any, args: any, ownProps: Props) => any;
  }
): (a: React.ComponentType<any>) => React.ComponentType<any>;
declare function withRPCRedux<Props extends {}>(
  rpcId: string,
  {
    propName,
    actions,
    transformParams,
    mapStateToParams,
  }?: {
    propName?: string;
    actions?: any;
    transformParams?: (params: any) => any;
    mapStateToParams?: (state: any, args: any, ownProps: Props) => any;
  }
): (a: React.ComponentType<any>) => React.ComponentType<any>;

declare function useRPCRedux(
  rpcId: string,
  {
    actions,
    transformParams,
    mapStateToParams,
  }?: {
    actions?: any;
    transformParams?: (params: any) => any;
    mapStateToParams?: (state: any, args?: any) => any;
  }
): (a: any) => Promise<any>;

declare const _default: fusion_core.FusionPlugin<RPCDepsType, RPCType>;

declare const mock: fusion_core.FusionPlugin<RPCDepsType, RPCType>;

export {_default as default, mock, useRPCRedux, withRPCReactor, withRPCRedux};
