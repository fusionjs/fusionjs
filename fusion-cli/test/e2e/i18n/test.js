/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const path = require('path');
const puppeteer = require('puppeteer');

const {createPlugin} = require('fusion-core');
const {default: App} = require('fusion-react');
const React = require('react');
const {test, getSimulator} = require('fusion-test-utils');
const {dev} = require('../utils.js');

const {
  default: Plugin,
  I18nToken,
  I18nLoaderToken,
  Translate,
  withTranslations,
} = require('fusion-plugin-i18n-react');

test('plugin', async t => {
  const data = {test: 'hello', interpolated: 'hi ${value}'};
  function Test(props) {
    t.equal(typeof props.translate, 'function');
    return React.createElement(
      'div',
      null,
      React.createElement(Translate, {id: 'test'})
    );
  }
  const Root = withTranslations(['test'])(Test);
  const app = new App(React.createElement(Root));
  app.register(I18nToken, Plugin);
  app.register(
    I18nLoaderToken,
    createPlugin({
      provides() {
        return {from: () => ({translations: data, locale: 'en_US'})};
      },
    })
  );
  app.middleware({i18n: I18nToken}, ({i18n}) => {
    return (ctx, next) => {
      const translator = i18n.from(ctx);
      t.equal(translator.translate('test'), 'hello');
      t.equal(
        translator.translate('interpolated', {value: 'world'}),
        'hi world'
      );
      return next();
    };
  });
  const simulator = getSimulator(app);
  const ctx = await simulator.render('/');
  t.ok(typeof ctx.body === 'string' && ctx.body.includes('hello'));
});

test('able to do simple translations in React 16 - leverages React.Fragment', async t => {
  const dir = path.resolve(__dirname, 'fixture');
  const {proc, port} = await dev(`--dir=${dir}`);
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  const allUrls = [];

  // enable request interception
  await page.setRequestInterception(true);
  page.on('request', request => {
    // Add a new header for navigation request.
    const headers = request.headers();
    headers['accept-language'] = 'en-US,en';
    request.continue({...request, _headers: headers});
  });

  page.on('response', response => {
    const req = response.request();
    allUrls.push(req.url());
  });

  await page.goto(`http://localhost:${port}/`, {waitUntil: 'load'});
  const content = await page.content();

  // No wrapping <span>s due to leveraging React.Fragment
  t.ok(content.includes(`<div id="root"><div>hello world</div></div>`));

  await browser.close();
  proc.kill();
  // $FlowFixMe - Need to add timeouts
}, 60000);
