// @noflow
import App from 'fusion-core';

if (__BROWSER__) {
  window.__browser_buffer_test__ = Buffer.from([
    0x62,
    0x75,
    0x66,
    0x66,
    0x65,
    0x72,
  ]).toString();
}

export default async function() {
  const app = new App('element', el => el);
  return app;
}
