/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-disable react/no-unescaped-entities */
import App from 'fusion-react';
import {render} from 'react-dom';
import fs from 'fs';
import React from 'react';
import {getSimulator} from 'fusion-test-utils';
import {Helmet} from 'react-helmet-async';
import HelmetPlugin from '../src/index.js';

const name = __NODE__ ? 'Server' : 'Client';

test(`${name} side render - default title escaping`, async () => {
  const TestA = () => {
    return (
      <div>
        <Helmet defaultTitle="My Default Title's </title>" />
      </div>
    );
  };

  const Root = (
    <div>
      <TestA />
    </div>
  );

  let app;
  let root;
  if (__BROWSER__) {
    root = document.createElement('div');
    root.setAttribute('id', 'root');
    if (document.body) {
      document.body.appendChild(root);
    }
    app = new App(Root, el => render(el, root));
  } else {
    app = new App(Root);
  }
  app.register(HelmetPlugin);
  app.middleware((ctx, next) => {
    ctx.nonce = 'test-nonce';
    return next();
  });
  const sim = getSimulator(app);
  const ctx = await sim.render('/');

  if (__NODE__) {
    const fixtureFile = './__fixtures__/ssr2.html';
    // Uncomment to regenerate fixture
    // fs.writeFileSync(fixtureFile, ctx.body);
    expect(ctx.body).toBe(fs.readFileSync(fixtureFile).toString());
  } else if (__BROWSER__) {
    // need to wait until next tick for dom changes
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(document.title).toBe("My Default Title's </title>");
  }
});
