// @flow
/* eslint-env browser */

import {createPlugin, unescape} from 'fusion-core';
import type {Context, FusionPlugin} from 'fusion-core';
import type {PluginServiceType} from './types.js';

const plugin =
  __BROWSER__ &&
  createPlugin({
    provides() {
      class PluginLogic {
        ctx: ?Context;
        value: ?string;
        constructor(ctx) {
          let value;
          const valueElement = document.getElementById('__PLUGIN_VALUE__');
          if (valueElement) {
            value = JSON.parse(unescape(valueElement.textContent));
          }
          this.ctx = ctx;
          this.value = value && value.value;
        }
      }
      return {
        from: (ctx?: Context) => {
          return new PluginLogic(ctx);
        },
      };
    },
    middleware(_, myPlugin) {
      return (ctx, next) => {
        const pluginValue = myPlugin.from(ctx);
        // eslint-disable-next-line no-console
        console.log('Middleware plugin value', pluginValue);
        return next();
      };
    },
  });

export default ((plugin: any): FusionPlugin<empty, PluginServiceType>);
