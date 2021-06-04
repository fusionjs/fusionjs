// @noflow
import App, {HttpServerToken, createPlugin} from 'fusion-core';
import {Server} from 'ws';

export default async function () {
  const app = new App('test', (el) => el);
  if (__NODE__) {
    app.register(
      createPlugin({
        deps: {
          server: HttpServerToken,
        },
        provides: ({server}) => {
          const wss = new Server({server});
          wss.on('connection', function connection(ws) {
            ws.on('message', function incoming(message) {
              ws.send(message);
            });
          });
        },
      })
    );
  }
  return app;
}
