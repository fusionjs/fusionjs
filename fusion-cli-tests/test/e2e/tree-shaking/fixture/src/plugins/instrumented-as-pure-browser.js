// @noflow
import {createPlugin} from 'fusion-core';

const PLUGIN = /*@__PURE__*/ createPlugin({
  provides() {
    console.log('instrumented-as-pure-browser-plugin');
  },
});
export default PLUGIN;
