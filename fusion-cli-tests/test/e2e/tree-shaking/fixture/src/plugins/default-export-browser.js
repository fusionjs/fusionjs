// @noflow
import {createPlugin} from 'fusion-core';

export default createPlugin({
  provides() {
    console.log('default-export-browser-plugin');
  },
});
