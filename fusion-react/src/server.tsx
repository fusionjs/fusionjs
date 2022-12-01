/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-env node */
import * as React from "react";
import Stream from "stream";
import { renderToString, renderToPipeableStream } from "react-dom/server";
import type { Logger } from "fusion-tokens";

export default (
  el: React.ReactElement<any>,
  ctx: any,
  logger?: Logger,
  ssrDecider?: (a: any) => boolean | "stream"
): Promise<string> => {
  const renderFullSSRFn = ssrDecider || ((ctx) => true);
  try {
    if (renderFullSSRFn(ctx) === true) {
      return Promise.resolve(`<div id='root'>${renderToString(el)}</div>`);
    } else {
      return new Promise((resolve, reject) => {
        ctx.res.socket.on("error", (error) => {
          logger && logger.error("Streaming SSR failed with error", error);
          if (__DEV__) {
            console.error("Streaming SSR failed with error", error);
          }
        });

        const shellTemplates = ctx.shellTemplate(ctx);

        // Create two streams. The inputStream is where React will pipe content into
        // The outputStream is what we assign ctx.body to which Koa will pipe to the Node res object
        // e.g. ctx.body.pipe(res)
        // Node strongly advises not to mix and match .on('data') and .pipe methods on the same stream
        // so we will utilize two streams. The first stream allows us to store the contents into a
        // buffer and then will write that same data to the output stream. When we detect that the
        // input is done, we will manually close the output as well.
        const inputStream = new Stream.PassThrough();
        const outputStream = new Stream.PassThrough();
        let buffer = "";
        // Attach event to read into buffer
        inputStream.on("data", (chunk) => {
          buffer += chunk;
          outputStream.write(chunk);
        });
        // Attach event to close outputStream when inputStream is done
        // React handles closing this for us
        inputStream.on("end", () => {
          outputStream.end();
        });
        // Assign to koa
        ctx.body = outputStream;
        // Determine if we are using modules or not
        const bootstrap = {};
        if (shellTemplates.useModuleScripts) {
          bootstrap.bootstrapModules = shellTemplates.scripts;
        } else {
          bootstrap.bootstrapScripts = shellTemplates.scripts;
        }
        // Let React pipe to the inputStream
        // $FlowFixMe[incompatible-exact]
        const { pipe } = renderToPipeableStream(<div id="root">{el}</div>, {
          ...bootstrap,
          nonce: ctx.nonce,
          onShellReady() {
            ctx.type = "html";
            inputStream.write(shellTemplates.start);
            pipe(inputStream);
            inputStream.write(shellTemplates.end);
          },
          onShellError() {
            // Fallback to CSR if the application shell fails to load
            // Also concat the necessary scripts for the page to load on the client
            buffer = [
              shellTemplates.start,
              `<div id="root" data-fusion-render="client"></div>`,
              shellTemplates.end,
            ].join("");

            const moduleTag = shellTemplates.useModuleScripts
              ? 'type="module"'
              : "";
            for (const script of shellTemplates.scripts) {
              buffer += `<script async src="${script}" nonce="${ctx.nonce}" ${moduleTag}></script>`;
            }
            ctx.body = buffer;
          },
          onAllReady() {
            resolve(buffer);
          },
          onError(e) {
            if (__DEV__) {
              console.error("Server-side stream failed", e);
            }
            logger && logger.error("Streaming SSR Failed with Error", e);
          },
        });
      });
    }
  } catch (e) {
    if (__DEV__) {
      console.error(
        "Server-side render failed. Falling back to client-side render",
        e
      );
    }
    logger && logger.error("SSR Failed with Error", e);
    return Promise.resolve('<div id="root" data-fusion-render="client"></div>');
  }
};
