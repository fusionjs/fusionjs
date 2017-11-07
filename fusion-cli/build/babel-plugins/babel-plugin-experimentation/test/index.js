// @flow
/* eslint-env node */
const test = require('tape');
const getExpected = require('./get-expected.js');
const transform = require('./transform.js');

test('withExperiment hoc', t => {
  t.plan(1);
  const result = transform(
    `
    import {withExperiment} from 'fusion-plugin-experimentation-react';

    function Component() {
      return <div>Hello World</div>;
    }

    export default withExperiment({experimentName: 'test-experiment', onError: () => {}})(Component);
  `
  );
  const expected = getExpected(
    `
    var _experimentation = ['test-experiment'];
    import { withExperiment } from 'fusion-plugin-experimentation-react';

    function Component() {
      return <div>Hello World</div>;
    }

    export default withExperiment({ experimentName: 'test-experiment', onError: () => {} })(Component);
  `
  );
  t.equal(result, expected);
  t.end();
});

test('withExperiment hoc, manualInclusionLogging', t => {
  t.plan(1);
  const result = transform(
    `
    import {withExperiment} from 'fusion-plugin-experimentation-react';

    function Component() {
      return <div>Hello World</div>;
    }

    export default withExperiment({experimentName: 'test-experiment', onError: () => {}, manualInclusionLogging: true})(Component);
  `
  );
  const expected = getExpected(
    `
    var _experimentation = ['test-experiment'];
    import { withExperiment } from 'fusion-plugin-experimentation-react';

    function Component() {
      return <div>Hello World</div>;
    }

    export default withExperiment({ experimentName: 'test-experiment', onError: () => {}, manualInclusionLogging: true })(Component);
  `
  );
  t.equal(result, expected);
  t.end();
});

test('withExperiment hoc with invalid params', t => {
  t.plan(1);
  t.throws(() => {
    transform(
      `
      import {withExperiment} from 'fusion-plugin-experimentation-react';

      function Component() {
        return <div>Hello World</div>;
      }

      export default withExperiment({experimentName: () => {}})(Component);
    `
    );
  });
  t.end();
});

test('withExperiment hoc with no experiments', t => {
  t.plan(1);
  const result = transform(
    `
    import {withExperiment} from 'fusion-plugin-experimentation-react';

    function Component() {
      return <div>foo</div>;
    }
  `
  );
  const expected = getExpected(
    `
    import { withExperiment } from 'fusion-plugin-experimentation-react';

    function Component() {
      return <div>foo</div>;
    }
  `,
    false
  );
  t.equal(result, expected);
  t.end();
});
