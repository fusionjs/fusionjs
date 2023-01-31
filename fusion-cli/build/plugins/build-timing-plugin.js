/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/*eslint-env node */

const webpack = require('webpack');

/*::
type OnBuildEndType = ({ buildTime: number, isIncrementalBuild: boolean}) => void;
*/

class BuildTimingPlugin {
  /*::
  onBuildEnd: OnBuildEndType;
  */
  constructor(onBuildEnd /*: OnBuildEndType */) {
    this.onBuildEnd = onBuildEnd;
  }

  apply(compiler /*: Object */) {
    const onBuildEnd = this.onBuildEnd;

    const buildState = {
      startTime: 0,
      isIncrementalBuild: false,
    };

    const ProgressPlugin = new webpack.ProgressPlugin((progress) => {
      if (
        progress === 0 ||
        // Initial build may start from non-zero point, so we use the time
        // of the very first progress event to track the build start time.
        (!buildState.isIncrementalBuild &&
          !buildState.startTime &&
          progress < 1)
      ) {
        buildState.startTime = Date.now();
      } else if (progress === 1) {
        if (!compiler.running || !buildState.startTime) {
          // Compiler may be closed mid-compilation, or while in idle state,
          // in which case the progress events will appear out of order, and
          // will not be representative to reliably calculate build duration.
          if (buildState.startTime > 0) {
            buildState.startTime = 0;
          }

          return;
        }

        const {startTime, isIncrementalBuild} = buildState;

        buildState.startTime = 0;
        buildState.isIncrementalBuild = true;

        onBuildEnd({
          buildTime: Date.now() - startTime,
          isIncrementalBuild,
        });
      }
    });

    ProgressPlugin.apply(compiler);
  }
}

module.exports = BuildTimingPlugin;
