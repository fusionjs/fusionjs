// @noflow
import { createPlugin, html } from 'fusion-core';

const ServerHmrStatsPlugin = createPlugin({
  provides() {
    if (typeof global.__TEST_SKIPPED_CLEANUP_COUNTER__ === 'undefined') {
      global.__TEST_SKIPPED_CLEANUP_COUNTER__ = 0;
    }

    if (typeof global.__TEST_RELOAD_COUNTER__ === 'undefined') {
      global.__TEST_RELOAD_COUNTER__ = 0;
    }

    return {
      reloadCounter: global.__TEST_RELOAD_COUNTER__++,
      skippedCleanupCounter: global.__TEST_SKIPPED_CLEANUP_COUNTER__++,
    }
  },

  cleanup() {
    global.__TEST_SKIPPED_CLEANUP_COUNTER__--;
  },

  middleware(_, serverHmrStats) {
    return async function (ctx, next) {
      if (ctx.path === '/server-hmr-stats') {
        ctx.type = 'application/json';
        ctx.body = JSON.stringify(serverHmrStats);

        return;
      }

      return next();
    }
  }
});

export default ServerHmrStatsPlugin;
