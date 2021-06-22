// @flow
import mapObject from 'just-map-object';
import isEqual from 'just-compare';
import ResponseError from './response-error';
import {type HandlerType} from './tokens';

export type RpcResponse = Object | ResponseError;
export type RpcResponseMap = Array<{
  args: Array<*>,
  response: RpcResponse,
}>;
export type RpcFixtureT = {[string]: RpcResponseMap | RpcResponse};
type OnMockRpcCallbackT = (
  handler: string,
  args: Array<*>,
  response: RpcResponse
) => void;

const getMockRpcHandlers = (
  fixtures: Array<RpcFixtureT>,
  onMockRpc?: OnMockRpcCallbackT
): HandlerType =>
  fixtures.reduce(
    (rpcHandlers, fixture) => ({
      ...rpcHandlers,
      ...mapObject(fixture, (rpcId, responseDetails) => async (...args) => {
        const response = Array.isArray(responseDetails)
          ? responseDetails.filter((item) => isEqual(item.args, args))[0]
              .response
          : responseDetails;

        onMockRpc && onMockRpc(rpcId, args, response);

        if (response instanceof Error) {
          throw response;
        }

        return response;
      }),
    }),
    {}
  );

export default getMockRpcHandlers;
