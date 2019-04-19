/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

import {createPlugin} from 'fusion-core';
import type {FusionPlugin} from 'fusion-core';
import {HttpHandlerToken, HttpHandlerConfigToken} from './tokens.js';
import type {DepsType} from './types.js';

const defaultConfig = {
  defer: true,
};

const plugin =
  __NODE__ &&
  createPlugin({
    deps: {
      handler: HttpHandlerToken,
      config: HttpHandlerConfigToken.optional,
    },
    middleware: deps => {
      const {handler, config = defaultConfig} = deps;
      return async (ctx, next) => {
        if (config.defer) {
          await next();
        }
        if (ctx.body) {
          return config.defer || next();
        }
        return new Promise((resolve, reject) => {
          const {req, res} = ctx;
          // Default http response object behavior defaults res.statusCode to 200. Koa sets it to 404.
          // This allows for http servers to use `end()` or express to use `send()` without specifying a 200 status code
          const prevStatusCode = ctx.res.statusCode;
          ctx.res.statusCode = 200;
          const listener = () => {
            // Makes koa-bodyparser compatible with bodyparser
            // $FlowFixMe
            req._body = true;
            // $FlowFixMe
            req.body = ctx.request.body;
            // $FlowFixMe
            res.setHeader = () => {};
            ctx.respond = false;
            done(null);
          };
          res.on('end', listener);
          res.on('finish', listener);

          handler(req, res, error => {
            ctx.res.statusCode = prevStatusCode;
            // $FlowFixMe
            return done(error);
          });

          function done(error) {
            // Express mutates the req object to make this property non-writable.
            // We need to make it writable because other plugins (like koa-helmet) will set it
            // $FlowFixMe
            Object.defineProperty(req, 'secure', {
              // $FlowFixMe
              value: req.secure,
              writable: true,
            });
            res.removeListener('end', listener);
            res.removeListener('finish', listener);
            if (error) {
              return reject(error);
            }
            return resolve();
          }
        }).then(() => {
          if (!config.defer) {
            return next();
          }
        });
      };
    },
  });

export default ((plugin: any): FusionPlugin<DepsType, void>);
