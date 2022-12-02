// @flow
const {transformSync} = require('@babel/core');

const plugin = require('../');

test('babel-plugin-i18n', () => {
  const translationIds = new Set();
  const output = transformSync(
    `
import {Translate} from 'fusion-plugin-i18n-react'; 

export default function() {
  return <Translate random={'test'} id="test" />
}
  `,
    {
      parserOpts: {
        plugins: ['jsx'],
      },
      plugins: [[plugin, {translationIds}]],
    }
  );
  expect(translationIds).toMatchInlineSnapshot(`
    Set {
      "test",
    }
  `);
  expect(output.code).toMatchInlineSnapshot(`
    "import { Translate } from 'fusion-plugin-i18n-react';
    export default function () {
      return <Translate random={'test'} id=\\"test\\" />;
    }"
  `);
});

test('babel-plugin-i18n - invalid usage of <Translate>', () => {
  const translationIds = new Set();
  expect(() =>
    transformSync(
      `
import {Translate} from 'fusion-plugin-i18n-react'; 

export default function() {
  return <Translate id={'expression'} />
}
  `,
      {
        parserOpts: {
          plugins: ['jsx'],
        },
        plugins: [[plugin, {translationIds}]],
      }
    )
  ).toThrow('The translate component must have props.id be a string literal.');
});

test('babel-plugin-i18n - valid usage of useTranslations', () => {
  const translationIds = new Set();
  const output = transformSync(
    `
import {useTranslations} from 'fusion-plugin-i18n-react'; 

export default function() {
  const translate = useTranslations();
  translate('static');
  translate(\`dynamic.\${foo}\`);
}
  `,
    {
      plugins: [[plugin, {translationIds}]],
    }
  );
  expect(translationIds).toMatchInlineSnapshot(`
    Set {
      "static",
      Array [
        "dynamic.",
        "",
      ],
    }
  `);
  expect(output.code).toMatchInlineSnapshot(`
    "import { useTranslations } from 'fusion-plugin-i18n-react';
    export default function () {
      const translate = useTranslations();
      translate('static');
      translate(\`dynamic.\${foo}\`);
    }"
  `);
});

test('babel-plugin-i18n - invalid usage of useTranslations', () => {
  const translationIds = new Set();
  expect(() =>
    transformSync(
      `
import {useTranslations} from 'fusion-plugin-i18n-react'; 

export default function() {
  const translate = useTranslations();
  translate(foo);
}
  `,
      {
        plugins: [[plugin, {translationIds}]],
      }
    )
  ).toThrow(
    'useTranslations result function must be passed string literal or hinted template literal'
  );
});
