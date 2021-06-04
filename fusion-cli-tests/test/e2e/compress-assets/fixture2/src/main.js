// @noflow
import App, {assetUrl} from 'fusion-core';

export default async function () {
  const app = new App('element', (el) => el);
  assetUrl('./assets/SVG_logo.svg');
  return app;
}
