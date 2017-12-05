// @flow
import Plugin from './plugin/plugin';
import SingletonPlugin from './singleton-plugin/singleton-plugin';
import compose from './compose';
export type PluginType<A> = {
  of(ctx: ?Object): A,
};
export {Plugin, SingletonPlugin, compose};
