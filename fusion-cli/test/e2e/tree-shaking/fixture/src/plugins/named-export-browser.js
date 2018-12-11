// @noflow
import {createPlugin} from 'fusion-core';

const plugin = createPlugin({
  provides() {
    console.log('named-export-browser-plugin');
  },
});

export {plugin};
