import {assetUrl} from 'fusion-core';
export default async function() {
  if (__NODE__) {
    const fs = require('fs');
    fs.writeFileSync('.fusion/test-asset', assetUrl('./static/test.js'));
  }
  return {
    plugins: [],
    callback() {},
  };
}
