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
test(`${name} side render`, async () => {
  const TestA = () => {
    return (
      <div>
        <Helmet defaultTitle="My Default Title">
          <html lang="en" amp />
          <body className="root" />
          <title itemProp="name" lang="en">
            My Title's {'</title>'}
          </title>
          <base target="_blank" href="http://mysite.com/" />
          <meta name="description" content="Helmet application" />
          <meta property="og:type" content="article" />
          <link rel="canonical" href="http://mysite.com/example" />
          <link
            rel="apple-touch-icon"
            href="http://mysite.com/img/apple-touch-icon-57x57.png"
          />
          <script src="http://include.com/pathtojs.js" type="text/javascript" />
          <script type="application/ld+json">{`
        {
            "@context": "http://schema.org"
        }
    `}</script>
          <noscript>{`
        <link rel="stylesheet" type="text/css" href="foo.css" />
    `}</noscript>

          <style type="text/css">{`
        body {
            background-color: blue;
        }

        p {
            font-size: 12px;
        }
    `}</style>
        </Helmet>
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
    root.setAttribute('id', 'root2');
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
    const fixtureFile = './__fixtures__/ssr1.html';
    // Uncomment to regenerate fixture
    // fs.writeFileSync(fixtureFile, ctx.body);
    expect(ctx.body).toBe(fs.readFileSync(fixtureFile).toString());
  } else if (__BROWSER__) {
    // need to wait until next tick for dom changes
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(document.title).toBe("My Title's </title>");
    const baseEl = document.querySelector('base');
    if (!baseEl) {
      throw new Error('Could not find base element');
    }
    expect(baseEl.getAttribute('href')).toBe('http://mysite.com/');
    const metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      throw new Error('Could not find meta description');
    }
    expect(metaDescription.getAttribute('content')).toBe('Helmet application');
    if (document.body && root instanceof HTMLElement) {
      document.body.removeChild(root);
    }
  }
});
