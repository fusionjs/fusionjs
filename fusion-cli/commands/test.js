/* eslint-env node */
const {Compiler} = require('../build/compiler');
const {TestRuntime} = require('../build/test-runtime');

exports.command = 'test [dir]';
exports.desc = 'Run tests';
exports.builder = {
  cover: {
    type: 'boolean',
    default: false,
    describe: 'Run tests with coverage',
  },
  // TODO(#20): support --debug flag
  // debug: {
  //   type: 'boolean',
  //   default: false,
  //   describe: 'Debug tests',
  // },
  'skip-build': {
    type: 'boolean',
    default: false,
    describe: 'Use existing built assets',
  },
  watch: {
    type: 'boolean',
    default: false,
    describe: 'Automatically re-profile your application on changes',
  },
};

exports.run = async function({dir = '.', cover, watch, skipBuild}) {
  const testRuntime = new TestRuntime({dir, cover});

  if (skipBuild) {
    await testRuntime.run();
    return {
      stop() {
        testRuntime.stop();
      },
    };
  }

  const compiler = new Compiler({envs: ['test'], dir, watch, cover});
  await compiler.clean();

  const watcher = await new Promise((resolve, reject) => {
    const watcher = compiler.start((err, stats) => {
      if (err || stats.hasErrors()) {
        return reject(err || new Error('Compiler stats included errors.'));
      }

      return resolve(watcher);
    });
  });

  const runTests = async () => {
    await testRuntime.run();
  };

  await runTests();

  if (watch) {
    compiler.on('done', runTests);
  }

  return {
    compiler,
    stop() {
      watcher.close();
      testRuntime.stop();
    },
  };
};
