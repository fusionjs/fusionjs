// @noflow
import App from 'fusion-core';
import child_process from 'child_process';
import cluster from 'cluster';
import crypto from 'crypto';
import dgram from 'dgram';
import dns from 'dns';
import fs from 'fs';
import module from 'module';
import net from 'net';
import readline from 'readline';
import repl from 'repl';
import tls from 'tls';

import defaultExportBrowserPlugin from './plugins/default-export-browser.js';
import defaultExportNodePlugin from './plugins/default-export-node.js';
import instrumentedAsPureBrowserPlugin from './plugins/instrumented-as-pure-browser.js';
import instrumentedAsPureNodePlugin from './plugins/instrumented-as-pure-node.js';
import {plugin as namedExportBrowserPlugin} from './plugins/named-export-browser.js';
import {plugin as namedExportNodePlugin} from './plugins/named-export-node.js';

export default async function() {
  const app = new App('element', el => el);
  __BROWSER__ && app.register(defaultExportBrowserPlugin);
  __NODE__ && app.register(defaultExportNodePlugin);
  __BROWSER__ && app.register(instrumentedAsPureBrowserPlugin);
  __NODE__ && app.register(instrumentedAsPureNodePlugin);
  __BROWSER__ && app.register(namedExportBrowserPlugin);
  __NODE__ && app.register(namedExportNodePlugin);
  __NODE__ &&
    app.middleware((ctx, next) => {
      if (ctx.url === '/fs') {
        ctx.body = Object.keys(fs);
      }
      return next();
    });
  __BROWSER__ &&
    app.middleware((ctx, next) => {
      console.log(Object.keys(fs));
    });
  return app;
}
