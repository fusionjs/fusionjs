// @flow
// $YARN is normally set by Bazel, but since tests run outside Bazel, we need to set the env var here
process.env.YARN = `${__dirname}/../node_modules/.bin/yarn`;

const assert = require('assert');
const {readFileSync, createWriteStream} = require('fs');
const {install} = require('../commands/install.js');
const {add} = require('../commands/add.js');
const {upgrade} = require('../commands/upgrade.js');
const {remove} = require('../commands/remove.js');
const {greenkeep} = require('../commands/greenkeep.js');
const {purge} = require('../commands/purge.js');
const {assertProjectDir} = require('../utils/assert-project-dir.js');
const {build, test, run} = require('../utils/bazel.js');
const {bazel, node, yarn} = require('../utils/binary-paths.js');
const {cli} = require('../utils/cli.js');
const {exec, exists, read, write, ls} = require('../utils/node-helpers.js');
const {downloadDeps} = require('../utils/download-deps.js');
const {findLocalDependency} = require('../utils/find-local-dependency.js');
const {
  generateBazelBuildRules,
} = require('../utils/generate-bazel-build-rules.js');
const {generateBazelignore} = require('../utils/generate-bazelignore.js');
const {generateDepLockfiles} = require('../utils/generate-dep-lockfiles.js');
const {getChunkPattern} = require('../utils/get-chunk-pattern.js');
const {getManifest} = require('../utils/get-manifest.js');
const {getLocalDependencies} = require('../utils/get-local-dependencies.js');
const {getRootDir} = require('../utils/get-root-dir.js');
const {installDeps} = require('../utils/install-deps.js');
const {parse} = require('../utils/parse-argv.js');
const {
  reportMismatchedTopLevelDeps,
} = require('../utils/report-mismatched-top-level-deps.js');
const {scaffold} = require('../utils/scaffold.js');
const {
  getCallArgItems,
  addCallArgItem,
  removeCallArgItem,
} = require('../utils/starlark.js');

process.on('unhandledRejection', e => {
  console.error(e.stack);
  process.exit(1);
});

runTests();

async function t(test) {
  const match = (process.argv[2] || '').toLowerCase();
  if (test.name.toLowerCase().indexOf(match) > -1) {
    if (match) console.log(`Testing ${test.name}`);
    return test();
  }
}

async function runTests() {
  await exec(`rm -rf ${__dirname}/tmp`);
  await exec(`mkdir -p ${__dirname}/tmp`);

  await Promise.all([
    t(testInstallAddUpgradeRemove),
    t(testGreenkeep),
    t(testPurge),
    t(testBazelDummy),
    t(testBazelBuild),
    t(testAssertProjectDir),
    t(testBinaryPaths),
    t(testCLI),
    t(testDownloadDeps),
    t(testFindLocalDependency),
    t(testGenerateBazelignore),
    t(testGenerateBazelBuildRules),
    t(testGenerateBazelBuildRulesUpdate),
    t(testGenerateDepLockfiles),
    t(testGetChunkPattern),
    t(testGetManifest),
    t(testGetLocalDependencies),
    t(testGetRootDir),
    t(testInstallDeps),
    t(testNodeHelpers),
    t(testParse),
    t(testReportMismatchedTopLevelDeps),
    t(testScaffold),
    t(testStarlark),
  ]);

  await exec(`rm -rf ${__dirname}/tmp`);

  console.log('All tests pass');
}

// commands
async function testInstallAddUpgradeRemove() {
  // // install
  await exec(`cp -r ${__dirname}/fixtures/commands/ ${__dirname}/tmp/commands`);
  await install({
    root: `${__dirname}/tmp/commands`,
    cwd: `${__dirname}/tmp/commands/a`,
  });
  assert(await exists(`${__dirname}/tmp/commands/a/node_modules/b`));
  assert(
    await exists(`${__dirname}/tmp/commands/a/node_modules/function-bind`)
  );

  // add linked package
  await add({
    root: `${__dirname}/tmp/commands`,
    cwd: `${__dirname}/tmp/commands/a`,
    name: 'c',
  });
  assert(await exists(`${__dirname}/tmp/commands/a/node_modules/c`));
  const buildFileAfterAdd = await read(
    `${__dirname}/tmp/commands/a/BUILD.bazel`,
    'utf8'
  );
  assert(buildFileAfterAdd.includes('//c:c'));

  // add external package
  await add({
    root: `${__dirname}/tmp/commands`,
    cwd: `${__dirname}/tmp/commands/a`,
    name: 'has',
    version: '1.0.3',
  });
  assert(
    JSON.parse(await read(`${__dirname}/tmp/commands/a/package.json`, 'utf8'))
      .dependencies['has']
  );
  assert(await exists(`${__dirname}/tmp/commands/a/node_modules/has`));

  // upgrade linked package
  await upgrade({
    root: `${__dirname}/tmp/commands`,
    cwd: `${__dirname}/tmp/commands/a`,
    name: 'c',
    version: '0.0.0',
  });
  assert(await exists(`${__dirname}/tmp/commands/a/node_modules/c`));
  const buildFileAfterUpgrade = await read(
    `${__dirname}/tmp/commands/a/BUILD.bazel`,
    'utf8'
  );
  assert(buildFileAfterUpgrade.includes('//c:c'));

  // upgrade external package
  await upgrade({
    root: `${__dirname}/tmp/commands`,
    cwd: `${__dirname}/tmp/commands/a`,
    name: 'has',
    version: '1.0.3',
  });
  assert(
    JSON.parse(await read(`${__dirname}/tmp/commands/a/package.json`, 'utf8'))
      .dependencies['has']
  );
  assert(await exists(`${__dirname}/tmp/commands/a/node_modules/has`));

  // remove linked package
  await remove({
    root: `${__dirname}/tmp/commands`,
    cwd: `${__dirname}/tmp/commands/a`,
    name: 'c',
  });
  assert(
    !JSON.parse(await read(`${__dirname}/tmp/commands/a/package.json`, 'utf8'))
      .dependencies.c
  );
  assert(!(await exists(`${__dirname}/tmp/commands/a/node_modules/c`)));

  // remove external package
  await remove({
    root: `${__dirname}/tmp/commands`,
    cwd: `${__dirname}/tmp/commands/a`,
    name: 'has',
  });
  assert(!(await exists(`${__dirname}/tmp/commands/a/node_modules/has`)));
}

async function testGreenkeep() {
  await exec(
    `cp -r ${__dirname}/fixtures/greenkeep/ ${__dirname}/tmp/greenkeep`
  );
  await greenkeep({
    root: `${__dirname}/tmp/greenkeep`,
    name: 'has',
    version: '1.0.3',
  });
  assert(
    (await read(`${__dirname}/tmp/greenkeep/a/package.json`)).includes(
      '"has": "1.0.3"'
    )
  );
  assert(
    (await read(`${__dirname}/tmp/greenkeep/a/yarn.lock`)).includes(
      'function-bind'
    )
  );

  await greenkeep({root: `${__dirname}/tmp/greenkeep`, name: 'b'});
  assert(
    (await read(`${__dirname}/tmp/greenkeep/a/package.json`)).includes(
      '"b": "1.0.0"'
    )
  );
}

async function testPurge() {
  await exec(`cp -r ${__dirname}/fixtures/purge/ ${__dirname}/tmp/purge`);
  await purge({root: `${__dirname}/tmp/purge`});
  assert(!(await exists(`${__dirname}/tmp/purge/a/node_modules`)));
  assert(
    !(await exists(
      `${__dirname}/tmp/purge/third_party/jazelle/temp/node_modules`
    ))
  );
}

// utils
async function testAssertProjectDir() {
  assert(
    await assertProjectDir({dir: `${__dirname}/fixtures/project-dir`}).then(
      () => true,
      () => false
    )
  );
  assert(
    await assertProjectDir({dir: `${__dirname}/fixtures/not-project-dir`}).then(
      () => false,
      () => true
    )
  );
}

async function testBazelDummy() {
  await exec(`cp -r ${__dirname}/fixtures/bazel/ ${__dirname}/tmp/bazel`);
  await build({
    root: `${__dirname}/tmp/bazel`,
    cwd: `${__dirname}/tmp/bazel`,
    name: 'target',
  });
  assert.equal(
    await read(`${__dirname}/tmp/bazel/bazel-bin/target.sh`, 'utf8'),
    'echo target'
  );

  const testStream = createWriteStream(
    `${__dirname}/tmp/bazel/test-stream.txt`
  );
  await new Promise(resolve => testStream.on('open', resolve));
  await test({
    root: `${__dirname}/tmp/bazel`,
    cwd: `${__dirname}/tmp/bazel`,
    name: 'target',
    stdio: ['ignore', testStream, 'ignore'],
  });
  assert(
    (await read(`${__dirname}/tmp/bazel/test-stream.txt`, 'utf8')).includes(
      'PASSED'
    )
  );

  const runStream = createWriteStream(`${__dirname}/tmp/bazel/run-stream.txt`);
  await new Promise(resolve => runStream.on('open', resolve));
  await run({
    root: `${__dirname}/tmp/bazel`,
    cwd: `${__dirname}/tmp/bazel`,
    name: 'target',
    stdio: ['ignore', runStream, 'ignore'],
  });
  assert(
    (await read(`${__dirname}/tmp/bazel/run-stream.txt`, 'utf8')).includes(
      'Executing tests from //:target'
    )
  );
}

async function testBazelBuild() {
  await exec(
    `cp -r ${__dirname}/fixtures/bazel-rules/ ${__dirname}/tmp/bazel-rules`
  );
  await install({
    root: `${__dirname}/tmp/bazel-rules`,
    cwd: `${__dirname}/tmp/bazel-rules/a`,
  });
  await build({
    root: `${__dirname}/tmp/bazel-rules`,
    cwd: `${__dirname}/tmp/bazel-rules/a`,
    name: 'a',
  });
  assert(await exists(`${__dirname}/tmp/bazel-rules/bazel-bin/a/output.tgz`));

  const testStream = createWriteStream(
    `${__dirname}/tmp/bazel-rules/test-stream.txt`
  );
  await new Promise(resolve => testStream.on('open', resolve));
  await test({
    root: `${__dirname}/tmp/bazel-rules`,
    cwd: `${__dirname}/tmp/bazel-rules/a`,
    name: 'test',
    stdio: ['ignore', testStream, 'ignore'],
  });
  assert(
    (await read(
      `${__dirname}/tmp/bazel-rules/test-stream.txt`,
      'utf8'
    )).includes('PASSED')
  );

  const runStream = createWriteStream(
    `${__dirname}/tmp/bazel-rules/run-stream.txt`
  );
  await new Promise(resolve => runStream.on('open', resolve));
  await run({
    root: `${__dirname}/tmp/bazel-rules`,
    cwd: `${__dirname}/tmp/bazel-rules/a`,
    name: 'test',
    stdio: ['ignore', runStream, 'ignore'],
  });
  assert(
    (await read(
      `${__dirname}/tmp/bazel-rules/run-stream.txt`,
      'utf8'
    )).includes('\nb\nv8.15.1')
  );
}

async function testBinaryPaths() {
  assert(await exists(bazel));
  assert(await exists(node));
  assert(await exists(yarn));
}

async function testCLI() {
  let called = '0';
  cli(
    'foo',
    {bar: '1'},
    {
      foo: [
        `Bar

      --bar [bar]     bar`,
        async ({bar}) => {
          called = bar;
        },
      ],
    },
    []
  );
  assert.equal(called, '1');
}

async function testDownloadDeps() {
  await exec(
    `cp -r ${__dirname}/fixtures/download-deps/ ${__dirname}/tmp/download-deps`
  );
  await downloadDeps({
    root: `${__dirname}/tmp/download-deps`,
    deps: [
      {
        meta: JSON.parse(
          await read(`${__dirname}/tmp/download-deps/a/package.json`, 'utf8')
        ),
        dir: `${__dirname}/tmp/download-deps/a`,
      },
    ],
  });
  assert(
    await exists(
      `${__dirname}/tmp/download-deps/third_party/jazelle/temp/.yarn-cache/no-bugs-1.0.0.tgz`
    )
  );
}

async function testFindLocalDependency() {
  const found = await findLocalDependency({
    root: `${__dirname}/fixtures/find-local-dependency`,
    name: 'a',
  });
  assert.deepEqual(
    found.meta,
    JSON.parse(
      await read(
        `${__dirname}/fixtures/find-local-dependency/a/package.json`,
        'utf8'
      )
    )
  );

  const notFound = await findLocalDependency({
    root: `${__dirname}/fixtures/find-local-dependency`,
    name: 'non-existent',
  });
  assert.deepEqual(notFound, undefined);
}

async function testGenerateBazelignore() {
  await exec(
    `cp -r ${__dirname}/fixtures/generate-bazelignore/ ${__dirname}/tmp/generate-bazelignore`
  );
  await generateBazelignore({
    root: `${__dirname}/tmp/generate-bazelignore`,
    projects: ['a', 'b'],
  });
  const bazelignore = await read(
    `${__dirname}/tmp/generate-bazelignore/.bazelignore`,
    'utf8'
  );
  assert(bazelignore.includes('a/node_modules'));
  assert(bazelignore.includes('b/node_modules'));
}

async function testGenerateBazelBuildRules() {
  await exec(
    `cp -r ${__dirname}/fixtures/generate-bazel-build-rules/ ${__dirname}/tmp/generate-bazel-build-rules`
  );
  await generateBazelBuildRules({
    root: `${__dirname}/tmp/generate-bazel-build-rules`,
    deps: [
      {
        meta: JSON.parse(
          await read(
            `${__dirname}/tmp/generate-bazel-build-rules/a/package.json`,
            'utf8'
          )
        ),
        dir: `${__dirname}/tmp/generate-bazel-build-rules/a`,
      },
      {
        meta: JSON.parse(
          await read(
            `${__dirname}/tmp/generate-bazel-build-rules/b/package.json`,
            'utf8'
          )
        ),
        dir: `${__dirname}/tmp/generate-bazel-build-rules/b`,
      },
    ],
    projects: ['a', 'b', 'c', 'd'],
  });
  const code = await read(
    `${__dirname}/tmp/generate-bazel-build-rules/a/BUILD.bazel`,
    'utf8'
  );
  assert(code.includes('# name: a\n'));
  assert(code.includes('# path: a\n'));
  assert(code.includes('# label: //a:a\n'));
  assert(code.includes('# dependencies: //b:b\n'));
  assert(
    await exists(`${__dirname}/tmp/generate-bazel-build-rules/b/BUILD.bazel`)
  );
  assert(
    (await read(
      `${__dirname}/tmp/generate-bazel-build-rules/c/BUILD.bazel`
    )).includes('# this file')
  );
  assert(
    !(await exists(`${__dirname}/tmp/generate-bazel-build-rules/d/BUILD.bazel`))
  );
}

async function testGenerateBazelBuildRulesUpdate() {
  await exec(
    `cp -r ${__dirname}/fixtures/generate-bazel-build-rules-update/ ${__dirname}/tmp/generate-bazel-build-rules-update`
  );
  await generateBazelBuildRules({
    root: `${__dirname}/tmp/generate-bazel-build-rules-update`,
    deps: [
      {
        meta: JSON.parse(
          await read(
            `${__dirname}/tmp/generate-bazel-build-rules-update/a/package.json`,
            'utf8'
          )
        ),
        dir: `${__dirname}/tmp/generate-bazel-build-rules-update/a`,
      },
      {
        meta: JSON.parse(
          await read(
            `${__dirname}/tmp/generate-bazel-build-rules-update/b/package.json`,
            'utf8'
          )
        ),
        dir: `${__dirname}/tmp/generate-bazel-build-rules-update/b`,
      },
    ],
    projects: ['a', 'b', 'c'],
  });
  assert(
    (await read(
      `${__dirname}/tmp/generate-bazel-build-rules-update/a/BUILD.bazel`
    )).includes('//b:b')
  );
  assert(
    !(await read(
      `${__dirname}/tmp/generate-bazel-build-rules-update/a/BUILD.bazel`
    )).includes('//c:c')
  );
  assert(
    (await read(
      `${__dirname}/tmp/generate-bazel-build-rules-update/a/BUILD.bazel`
    )).includes('//external:external')
  );
}

async function testGenerateDepLockfiles() {
  await exec(
    `cp -r ${__dirname}/fixtures/generate-dep-lockfiles/ ${__dirname}/tmp/generate-dep-lockfiles`
  );
  await generateDepLockfiles({
    deps: [
      {
        meta: JSON.parse(
          await read(
            `${__dirname}/tmp/generate-dep-lockfiles/a/package.json`,
            'utf8'
          )
        ),
        dir: `${__dirname}/tmp/generate-dep-lockfiles/a`,
      },
    ],
  });
  assert(
    (await read(
      `${__dirname}/tmp/generate-dep-lockfiles/a/yarn.lock`,
      'utf8'
    )).includes('has@')
  );
}

async function testGetChunkPattern() {
  await exec(
    `cp -r ${__dirname}/fixtures/get-chunk-pattern/ ${__dirname}/tmp/get-chunk-pattern`
  );
  assert.equal(
    await getChunkPattern({
      root: `${__dirname}/fixtures/get-chunk-pattern`,
      patterns: ['tests/**/*', '!tests/fixtures/**/*'],
      jobs: 2,
      index: 0,
    }),
    '.*/tests/test-1.js|.*/tests/test-3.js'
  );

  assert.equal(
    await getChunkPattern({
      root: `${__dirname}/fixtures/get-chunk-pattern`,
      patterns: ['tests/**/*', '!tests/fixtures/**/*'],
      jobs: 2,
      index: 1,
    }),
    '.*/tests/test-2.js'
  );

  assert.equal(
    await getChunkPattern({
      root: `${__dirname}/fixtures/get-chunk-pattern`,
      patterns: ['tests/**/*', '!tests/fixtures/**/*'],
      jobs: 4,
      index: 3,
    }),
    ''
  );
}

async function testGetLocalDependencies() {
  await exec(
    `cp -r ${__dirname}/fixtures/get-local-dependencies/ ${__dirname}/tmp/get-local-dependencies`
  );
  const localDeps = await getLocalDependencies({
    dirs: [
      `${__dirname}/tmp/get-local-dependencies/a`,
      `${__dirname}/tmp/get-local-dependencies/b`,
      `${__dirname}/tmp/get-local-dependencies/c`,
    ],
    target: `${__dirname}/tmp/get-local-dependencies/a`,
  });
  assert.deepEqual(localDeps, [
    {
      meta: JSON.parse(
        await read(
          `${__dirname}/tmp/get-local-dependencies/b/package.json`,
          'utf8'
        )
      ),
      dir: `${__dirname}/tmp/get-local-dependencies/b`,
    },
    {
      meta: JSON.parse(
        await read(
          `${__dirname}/tmp/get-local-dependencies/a/package.json`,
          'utf8'
        )
      ),
      dir: `${__dirname}/tmp/get-local-dependencies/a`,
    },
  ]);
}

async function testGetManifest() {
  assert.deepEqual(
    await getManifest({root: `${__dirname}/fixtures/get-all-project-paths`}),
    {
      projects: ['path/to/a', 'path/to/b'],
    }
  );
}

async function testGetRootDir() {
  assert(
    await getRootDir({dir: `${__dirname}/fixtures/get-root-dir/a`}).then(
      () => true,
      () => false
    )
  );
}

async function testInstallDeps() {
  await exec(
    `cp -r ${__dirname}/fixtures/install-deps/ ${__dirname}/tmp/install-deps`
  );
  await installDeps({
    root: `${__dirname}/tmp/install-deps`,
    deps: [
      {
        meta: JSON.parse(
          await read(`${__dirname}/tmp/install-deps/b/package.json`, 'utf8')
        ),
        dir: `${__dirname}/tmp/install-deps/b`,
      },
      {
        meta: JSON.parse(
          await read(`${__dirname}/tmp/install-deps/a/package.json`, 'utf8')
        ),
        dir: `${__dirname}/tmp/install-deps/a`,
      },
    ],
  });
  assert(await exists(`${__dirname}/tmp/install-deps/a/node_modules/b`));
}

async function testNodeHelpers() {
  await exec(
    `cp -r ${__dirname}/fixtures/node-helpers/ ${__dirname}/tmp/node-helpers`
  );
  assert.equal(await exec('echo abc'), 'abc\n');
  assert(await exists(__filename));
  assert.deepEqual(await ls(`${__dirname}/fixtures/node-helpers`), [
    'file.txt',
  ]);
  await write(`${__dirname}/tmp/node-helpers/file.txt`, 'hello', 'utf8');
  const text = readFileSync(`${__dirname}/tmp/node-helpers/file.txt`, 'utf8');
  assert(await read(`${__dirname}/tmp/node-helpers/file.txt`, 'utf8'), text);
  assert(text, 'hello');
}

async function testParse() {
  assert.deepEqual(parse(['hello', '--foo', 'foo', '--bar']), {
    name: 'hello',
    foo: 'foo',
    bar: true,
  });
}

async function testReportMismatchedTopLevelDeps() {
  await exec(
    `cp -r ${__dirname}/fixtures/report-mismatched-top-level-deps/ ${__dirname}/tmp/report-mismatched-top-level-deps`
  );
  const result = await reportMismatchedTopLevelDeps({
    root: `${__dirname}/tmp/report-mismatched-top-level-deps`,
    projects: ['packages/a', 'packages/b', 'packages/c'],
    versionPolicy: {
      lockstep: false,
      exceptions: ['no-bugs'],
    },
  });
  assert.deepEqual(result, {
    valid: false,
    policy: {
      lockstep: false,
      exceptions: ['no-bugs'],
    },
    reported: {
      'no-bugs': {
        '^1.0.0': ['@uber/a', '@uber/b'],
        'npm:function-bind': ['@uber/c'],
      },
    },
  });
}

async function testScaffold() {
  await exec(`mkdir ${__dirname}/tmp/scaffold`);
  await scaffold({cwd: `${__dirname}/tmp/scaffold`});
  assert(await exists(`${__dirname}/tmp/scaffold/WORKSPACE`));
  assert(await exists(`${__dirname}/tmp/scaffold/BUILD.bazel`));
  assert(await exists(`${__dirname}/tmp/scaffold/.bazelversion`));
  assert(await exists(`${__dirname}/tmp/scaffold/manifest.json`));
  assert(await exists(`${__dirname}/tmp/scaffold/.gitignore`));
}

async function testStarlark() {
  await exec(`cp -r ${__dirname}/fixtures/starlark/ ${__dirname}/tmp/starlark`);
  const indented = await read(
    `${__dirname}/tmp/starlark/indented/BUILD.bazel`,
    'utf8'
  );
  assert.deepEqual(getCallArgItems(indented, 'web_library', 'deps'), [
    '"//a:a"',
    '"//b:b"',
  ]);

  const indentedWithAddedDep = addCallArgItem(
    indented,
    'web_library',
    'deps',
    '"//c:c"'
  );
  assert.equal(
    indentedWithAddedDep.trim(),
    `
web_library(
  name = "foo",
  deps = [
    "//a:a",
    "//b:b",
    "//c:c",
  ]
)
  `.trim()
  );

  const indentedWithRemovedDep = removeCallArgItem(
    indentedWithAddedDep,
    'web_library',
    'deps',
    '"//b:b"'
  );
  assert.equal(
    indentedWithRemovedDep.trim(),
    `
web_library(
  name = "foo",
  deps = [
    "//a:a",
    "//c:c",
  ]
)
  `.trim()
  );

  const inline = await read(
    `${__dirname}/tmp/starlark/inline/BUILD.bazel`,
    'utf8'
  );
  const inlineWithAddedDep = addCallArgItem(
    inline,
    'web_library',
    'deps',
    '"//c:c"'
  );
  assert.equal(
    inlineWithAddedDep.trim(),
    `
web_library(
  name = "foo",
  deps = ["//a:a", "//b:b", "//c:c"]
)
  `.trim()
  );

  const commented = await read(
    `${__dirname}/tmp/starlark/comments/BUILD.bazel`,
    'utf8'
  );
  const commentedWithAddedDep = addCallArgItem(
    commented,
    'web_library',
    'deps',
    '"//c:c"'
  );
  assert.equal(
    commentedWithAddedDep
      .split('\n')
      .map(l => l.trimEnd())
      .join('\n')
      .trim(),
    `
web_library(    # comment
  name = "foo", # comment
  deps = [
    "//a:a",
    "//b:b",
    "//c:c",
  ]             # comment
)               # comment
  `.trim()
  );

  const commentedWithRemovedDep = removeCallArgItem(
    commentedWithAddedDep,
    'web_library',
    'deps',
    '"//b:b"'
  );
  assert.equal(
    commentedWithRemovedDep
      .split('\n')
      .map(l => l.trimEnd())
      .join('\n')
      .trim(),
    `
web_library(    # comment
  name = "foo", # comment
  deps = [
    "//a:a",
    "//c:c",
  ]             # comment
)               # comment
  `.trim()
  );
}
