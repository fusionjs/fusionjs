// @flow
/* eslint-env node */

const MINIMAL_SUMMARY_STATS = {
  all: false,
  builtAt: true,
  errorDetails: true,
  errors: true,
  errorsCount: true,
  errorStack: true,
  timings: true,
  warnings: true,
  warningsCount: true,
};

const FULL_STATS = {
  // Note: need to reduce memory and disk space usage to help with some faulty builds (OOMs)
  children: {
    // None of the analyzers inspect child compilations, so we can keep it to a minimum
    children: MINIMAL_SUMMARY_STATS,
  },
  // No need to include all modules, as they are also grouped by chunk,
  // and this is enough for most bundle analyzers to generate report
  modules: false,
};

const MINIMAL_STATS = {
  ...MINIMAL_SUMMARY_STATS,
  children: {
    children: MINIMAL_SUMMARY_STATS,
  },
};

const STATS_VERBOSITY_LEVELS = {
  full: 'full',
  minimal: 'minimal',
};

/*::
export type STATS_VERBOSITY_LEVELS_TYPE = $Keys<typeof STATS_VERBOSITY_LEVELS>;
*/

module.exports = {
  FULL_STATS,
  MINIMAL_STATS,
  STATS_VERBOSITY_LEVELS,
};
