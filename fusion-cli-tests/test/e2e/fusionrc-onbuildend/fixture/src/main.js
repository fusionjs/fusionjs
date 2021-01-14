// @noflow
import App from 'fusion-core';

export default function start() {
  const app = new App('<div class="class-name"/>', el => el);
  return app;
}
