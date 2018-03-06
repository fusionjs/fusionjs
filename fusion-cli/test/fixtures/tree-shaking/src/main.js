import App from 'fusion-core';
import child_process from 'child_process';
import cluster from 'cluster';
import dgram from 'dgram';
import dns from 'dns';
import fs from 'fs';
import module from 'module';
import net from 'net';
import readline from 'readline';
import repl from 'repl';
import tls from 'tls';

export default async function() {
  const app = new App('element', el => el);
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
