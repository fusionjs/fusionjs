/* eslint-env node */
require('./cli/dev');
require('./cli/test');
require('./cli/build');
require('./compiler/api');
require('./compiler/errors');
require('./hmr');
require('./route-prefix.js');

/*
require('./browser-support');
*/
require('../build/babel-plugins/babel-plugin-pure-create-plugin/test');
require('../build/babel-plugins/babel-plugin-asseturl/test');
require('../build/babel-plugins/babel-plugin-chunkid/test');
require('../build/babel-plugins/babel-plugin-experimentation/test');
require('../build/babel-plugins/babel-plugin-i18n/test');
require('../build/babel-plugins/babel-plugin-sw/test');
require('../build/babel-plugins/babel-plugin-sync-chunk-ids/test');
require('../build/babel-plugins/babel-plugin-sync-chunk-paths/test');
require('../build/babel-plugins/babel-plugin-utils/test');
