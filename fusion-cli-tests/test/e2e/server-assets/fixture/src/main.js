// @noflow
import App, {assetUrl} from 'fusion-core';

import {serverAsset} from './server-assets.js';

const asset = assetUrl('./assets/universal-asset.txt');

export default async function() {
  const app = new App('element', el => el);
  if (__NODE__) {
    serverAsset();
  }
  console.log(asset);
  return app;
}
