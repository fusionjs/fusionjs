// @flow

import {createPlugin, memoize, html} from 'fusion-core';
import type {FusionPlugin, Context} from 'fusion-core';
import type {PluginServiceType} from './types.js';

const plugin =
  __NODE__ &&
  createPlugin({
    provides() {
      class PluginLogic {
        ctx: Context;
        value: ?string;

        constructor(ctx) {
          this.ctx = ctx;
          this.value = null;
        }
        async init() {
          this.value = '__plugin__value__';
          return this.value;
        }
      }
      return {
        from: memoize(ctx => new PluginLogic(ctx)),
      };
    },
    middleware(_, myPlugin) {
      return async (ctx, next) => {
        if (!ctx.element) return next();
        const pluginValue = await myPlugin.from(ctx).init();
        await next();

        const serialized = JSON.stringify({value: pluginValue});
        const script = html`<script type="application/json" id="__PLUGIN_VALUE__">${serialized}</script>`;
        ctx.template.body.push(script);
      };
    },
  });

export default ((plugin: any): FusionPlugin<empty, PluginServiceType>);
