import http from 'http';
import _request from 'request-promise';
import getPort from 'get-port';

export async function startServer(handler) {
  const port = await getPort();
  const server = http.createServer(handler);
  await new Promise(resolve => {
    server.listen(port, resolve);
  });
  return {
    server,
    request: (url, options) => {
      return _request(`http://localhost:${port}${url}`, options);
    },
  };
}
