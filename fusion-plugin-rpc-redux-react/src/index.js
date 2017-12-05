import plugin from './plugin';
import {ProviderPlugin} from 'fusion-react';
export {createRPCReducer} from 'fusion-rpc-redux';
import {mock as RPCMock} from 'fusion-plugin-rpc';
export {withRPCRedux, withRPCReactor} from './hoc';

export default plugin;

export const mock = ProviderPlugin.create('rpc', RPCMock);
