import App from 'fusion-react';
import {render} from 'react-dom';
import fs from 'fs';
import React from 'react';
import {getSimulator} from 'fusion-test-utils';
import Helmet from 'react-helmet-async';
import test from 'tape-cup';
import HelmetPlugin from '../index.js';

const name = __NODE__ ? 'Server' : 'Client';
test(`${name} side render`, async t => {
  const TestA = () => {
    return (
      <div>
        <Helmet defaultTitle="My Default Title">
          <html lang="en" amp />
          <body className="root" />
          <title itemProp="name" lang="en">
            My Title
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
    root.setAttribute('id', 'root');
    document.body.appendChild(root);
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
    const fixtureFile = './src/__fixtures__/ssr1.html';
    // Uncomment to regenerate fixture
    // fs.writeFileSync(fixtureFile, ctx.body);
    t.equal(ctx.body, fs.readFileSync(fixtureFile).toString());
  } else if (__BROWSER__) {
    // need to wait until next tick for dom changes
    await new Promise(resolve => setTimeout(resolve, 10));
    t.equal(document.title, 'My Title');
    t.equal(
      document.querySelector('base').getAttribute('href'),
      'http://mysite.com/'
    );
    t.equal(
      document
        .querySelector('meta[name="description"]')
        .getAttribute('content'),
      'Helmet application'
    );
    document.body.removeChild(root);
  }
  t.end();
});
