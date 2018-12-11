// @noflow
import {createPlugin} from 'fusion-core';

const PLUGIN = /*@__PURE__*/ createPlugin({
  provides() {
    console.log('instrumented-as-pure-node-plugin');
  },
});
export default PLUGIN;
