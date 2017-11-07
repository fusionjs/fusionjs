/* eslint-env node */
const path = require('path');
const getPort = require('get-port');
const chalk = require('chalk');
const express = require('express');
const {Compiler} = require('./build/compiler');
const spawn = require('./build/spawn');

const {
  loadSourceMap,
  computeGeneratedFileSizes,
} = require('source-map-explorer');

module.exports = function sourceMapExplorer({dir}) {
  getPort().then(port => {
    let data = null;
    const connections = new Set();

    process.env.PORT_HTTP = port;
    const compiler = new Compiler({dir, envs: ['production'], watch: true});
    compiler.on('done', multistats => {
      const stat = multistats.stats.find(s => s.compilation.name === 'client');
      const stats = stat.compilation.chunks.map(({files}) => {
        const base = path.resolve(
          process.cwd(),
          '.fusion/dist/production/client'
        );

        const file = files.find(f => f.match(/\.js$/));
        const js = path.resolve(base, file);
        const map = path.resolve(base, files.find(f => f.match(/\.js.map$/)));

        const {mapConsumer, jsData} = loadSourceMap(js, map);
        return {
          sizes: computeGeneratedFileSizes(mapConsumer, jsData),
          chunk: file.replace(/-[^-]+\.js$/, '-[hash].js'),
        };
      });
      data = stats;
      for (const res of connections) {
        res.write('data: ' + JSON.stringify(data) + '\n\n');
      }
      // eslint-disable-next-line no-console
      console.log(
        chalk.green(
          'Hot reloading source map explorer running at http://localhost:9000'
        )
      );
    });
    compiler.start();

    const app = express();
    app.get('/', (req, res) => {
      res.send(getHTML(data));
    });

    app.get('/_sse', (req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      connections.add(res);
      req.connection.addListener('close', () => connections.delete(res));
    });

    app.listen(9000);
    spawn(`open http://localhost:9000/#all`);
  });
};

// code below is adapted from
// https://github.com/danvk/source-map-explorer/blob/df11ddc691d82dace0b6a1b2dee31831d8fef93b/index.js#L200
// and
// https://github.com/danvk/source-map-explorer/blob/df11ddc691d82dace0b6a1b2dee31831d8fef93b/tree-viz.html
function getHTML(data) {
  return `
<!doctype html>
<head>
  <meta charset="UTF-8">
  <title>Source Map Explorer</title>

  <style>
  /* Vendored from https://github.com/rmmh/webtreemap/blob/9fa0c066a10ea4402d960b0c6c1a432846ac7fc4/webtreemap.css */

  .webtreemap-node {
    /* Required attributes. */
    position: absolute;
    overflow: hidden;   /* To hide overlong captions. */
    background: white;  /* Nodes must be opaque for zIndex layering. */
    border: solid 1px black;  /* Calculations assume 1px border. */

    /* Optional: CSS animation. */
    transition: top    0.3s,
                left   0.3s,
                width  0.3s,
                height 0.3s;
  }

  /* Optional: highlight nodes on mouseover. */
  .webtreemap-node:hover {
    background: #eee;
  }

  /* Optional: Different background colors depending on symbol. */
  .webtreemap-symbol-bss {
    background: #66C2A5;
  }
  .webtreemap-symbol-data {
    background: #FC8D62;
  }
  .webtreemap-symbol-read-only_data {
    background: #8DA0CB;
  }
  .webtreemap-symbol-code {
    background: #E78AC3;
  }
  .webtreemap-symbol-weak_symbol {
    background: #A6D854;
  }
  .webtreemap-symbol-bss.webtreemap-aggregate {
    background: #B3E2CD;
  }
  .webtreemap-symbol-data.webtreemap-aggregate {
    background: #FDCDAC;
  }
  .webtreemap-symbol-read-only_data.webtreemap-aggregate {
    background: #CBD5E8;
  }
  .webtreemap-symbol-code.webtreemap-aggregate {
    background: #F4CAE4;
  }
  .webtreemap-symbol-weak_symbol.webtreemap-aggregate {
    background: #E6F5C9;
  }

  #legend > * {
    border: solid 1px #444;
  }

  /* Optional: Different borders depending on level. */
  .webtreemap-level0 {
    border: solid 1px #444;
  }
  .webtreemap-level1 {
    border: solid 1px #666;
  }
  .webtreemap-level2 {
    border: solid 1px #888;
  }
  .webtreemap-level3 {
    border: solid 1px #aaa;
  }
  .webtreemap-level4 {
    border: solid 1px #ccc;
  }

  /* Optional: styling on node captions. */
  .webtreemap-caption {
    font-family: sans-serif;
    font-size: 11px;
    padding: 2px;
    text-align: center;
  }

  /* Optional: styling on captions on mouse hover. */
  /*.webtreemap-node:hover > .webtreemap-caption {
    text-decoration: underline;
  }*/

  html, body {
    height: 100%;
  }
  body {
    font-family: sans-serif;
    font-size: 0.8em;
    margin: 0;
  }
  #nav {
    padding: 5px 10px;
  }
  :target {
    font-weight:bold;
  }
  #map {
    top: 30px;
    bottom: 10px;
    left: 10px;
    right: 10px;
    position: absolute;
    cursor: pointer;
    -webkit-user-select: none;
  }
  #loader {
    margin: auto;
    width: 250px;
  }
  #progress {
    animation: load 30s ease-out infinite;
    background: #bada55;
    height: 3px;
    margin: 0 0 3px;
  }
  @keyframes load {
    from {width:0;}
    to {width: 100%;}
  }
  </style>
</head>
<body>
  <div id='nav'></div>
  <div id='map'>
    <div id='loader'>
      <div id='progress'></div>
      Building fresh production source maps...
    </div>
  </div>

  <script>
// Vendored from https://github.com/rmmh/webtreemap/blob/9fa0c066a10ea4402d960b0c6c1a432846ac7fc4/webtreemap.js

// Copyright 2013 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Size of border around nodes.
// We could support arbitrary borders using getComputedStyle(), but I am
// skeptical the extra complexity (and performance hit) is worth it.

;(function() {
var kBorderWidth = 1;

// Padding around contents.
// TODO: do this with a nested div to allow it to be CSS-styleable.
var kPadding = 4;

// x/y ratio to aim for -- wider rectangles are better for text display
var kAspectRatio = 1.2;

var focused = null;

function focus(tree) {
  focused = tree;

  // Hide all visible siblings of all our ancestors by lowering them.
  var level = 0;
  var root = tree;
  while (root.parent) {
    root = root.parent;
    level += 1;
    for (var i = 0, sibling; sibling = root.children[i]; ++i) {
      if (sibling.dom)
        sibling.dom.style.zIndex = 0;
    }
  }
  var width = root.dom.offsetWidth;
  var height = root.dom.offsetHeight;
  // Unhide (raise) and maximize us and our ancestors.
  for (var t = tree; t.parent; t = t.parent) {
    // Shift off by border so we don't get nested borders.
    position(t.dom, -kBorderWidth, -kBorderWidth, width, height);
    t.dom.style.zIndex = 1;
  }
  // And layout into the topmost box.
  layout(tree, level, width, height);
}

function makeDom(tree, level) {
  var dom = document.createElement('div');
  dom.style.zIndex = 1;
  dom.className = 'webtreemap-node webtreemap-level' + Math.min(level, 4);
  if (tree.data['$symbol']) {
    dom.className += (' webtreemap-symbol-' +
  tree.data['$symbol'].replace(' ', '_'));
  }
  if (tree.data['$dominant_symbol']) {
    dom.className += (' webtreemap-symbol-' +
  tree.data['$dominant_symbol'].replace(' ', '_'));
    dom.className += (' webtreemap-aggregate');
  }

  dom.onmousedown = function(e) {
    if (e.button == 0) {
      if (focused && tree == focused && focused.parent) {
        focus(focused.parent);
      } else {
        focus(tree);
      }
    }
    e.stopPropagation();
    return true;
  };

  var caption = document.createElement('div');
  caption.className = 'webtreemap-caption';
  caption.innerHTML = tree.name;
  dom.appendChild(caption);
  dom.title = tree.name;

  tree.dom = dom;
  return dom;
}

function position(dom, x, y, width, height) {
  // CSS width/height does not include border.
  width -= kBorderWidth*2;
  height -= kBorderWidth*2;

  dom.style.left   = x + 'px';
  dom.style.top    = y + 'px';
  dom.style.width  = Math.max(width, 0) + 'px';
  dom.style.height = Math.max(height, 0) + 'px';
}

// Given a list of rectangles |nodes|, the 1-d space available
// |space|, and a starting rectangle index |start|, compute an span of
// rectangles that optimizes a pleasant aspect ratio.
//
// Returns [end, sum], where end is one past the last rectangle and sum is the
// 2-d sum of the rectangles' areas.
function selectSpan(nodes, space, start) {
  // Add rectangle one by one, stopping when aspect ratios begin to go
  // bad.  Result is [start,end) covering the best run for this span.
  // http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.36.6685
  var node = nodes[start];
  var rmin = node.data['$area'];  // Smallest seen child so far.
  var rmax = rmin;                // Largest child.
  var rsum = 0;                   // Sum of children in this span.
  var last_score = 0;             // Best score yet found.
  for (var end = start; node = nodes[end]; ++end) {
    var size = node.data['$area'];
    if (size < rmin)
      rmin = size;
    if (size > rmax)
      rmax = size;
    rsum += size;

    // This formula is from the paper, but you can easily prove to
    // yourself it's taking the larger of the x/y aspect ratio or the
    // y/x aspect ratio.  The additional magic fudge constant of kAspectRatio
    // lets us prefer wider rectangles to taller ones.
    var score = Math.max(space*space*rmax / (rsum*rsum),
                         kAspectRatio*rsum*rsum / (space*space*rmin));
    if (last_score && score > last_score) {
      rsum -= size;  // Undo size addition from just above.
      break;
    }
    last_score = score;
  }
  return [end, rsum];
}

function layout(tree, level, width, height) {
  if (!('children' in tree))
    return;

  var total = tree.data['$area'];

  // XXX why do I need an extra -1/-2 here for width/height to look right?
  var x1 = 0, y1 = 0, x2 = width - 1, y2 = height - 2;
  x1 += kPadding; y1 += kPadding;
  x2 -= kPadding; y2 -= kPadding;
  y1 += 14;  // XXX get first child height for caption spacing

  var pixels_to_units = Math.sqrt(total / ((x2 - x1) * (y2 - y1)));

  // The algorithm does best at laying out items from largest to smallest.
  // Sort them to ensure this.
  if (!tree.children.sorted) {
    tree.children.sort(function (a, b) {
      return b.data['$area'] - a.data['$area'];
    });
    tree.children.sorted = true;
  }

  for (var start = 0, child; child = tree.children[start]; ++start) {
    if (x2 - x1 < 60 || y2 - y1 < 40) {
      if (child.dom) {
        child.dom.style.zIndex = 0;
        position(child.dom, -2, -2, 0, 0);
      }
      continue;
    }

    // Dynamically decide whether to split in x or y based on aspect ratio.
    var ysplit = ((y2 - y1) / (x2 - x1)) > kAspectRatio;

    var space;  // Space available along layout axis.
    if (ysplit)
      space = (y2 - y1) * pixels_to_units;
    else
      space = (x2 - x1) * pixels_to_units;

    var span = selectSpan(tree.children, space, start);
    var end = span[0], rsum = span[1];

    // Now that we've selected a span, lay out rectangles [start,end) in our
    // available space.
    var x = x1, y = y1;
    for (var i = start; i < end; ++i) {
      child = tree.children[i];
      if (!child.dom) {
        child.parent = tree;
        child.dom = makeDom(child, level + 1);
        tree.dom.appendChild(child.dom);
      } else {
        child.dom.style.zIndex = 1;
      }
      var size = child.data['$area'];
      var frac = size / rsum;
      if (ysplit) {
        width = rsum / space;
        height = size / width;
      } else {
        height = rsum / space;
        width = size / height;
      }
      width /= pixels_to_units;
      height /= pixels_to_units;
      width = Math.round(width);
      height = Math.round(height);
      position(child.dom, x, y, width, height);
      if ('children' in child) {
        layout(child, level + 1, width, height);
      }
      if (ysplit)
        y += height;
      else
        x += width;
    }

    // Shrink our available space based on the amount we used.
    if (ysplit)
      x1 += Math.round((rsum / space) / pixels_to_units);
    else
      y1 += Math.round((rsum / space) / pixels_to_units);

    // end points one past where we ended, which is where we want to
    // begin the next iteration, but subtract one to balance the ++ in
    // the loop.
    start = end - 1;
  }
}

function appendTreemap(dom, data) {
  var style = getComputedStyle(dom, null);
  var width = parseInt(style.width);
  var height = parseInt(style.height);
  if (!data.dom)
    makeDom(data, 0);
  dom.appendChild(data.dom);
  position(data.dom, 0, 0, width, height);
  layout(data, 0, width, height);
}

window.appendTreemap = appendTreemap;
})(window);

var data = ${JSON.stringify(data)};
var tree = mergeChunks(data);
var treeData = {};

var nav = document.getElementById('nav');
var map = document.getElementById('map');

if (typeof EventSource === 'undefined') {
  var error = 'Your browser does not support Server Side Events. Try using a different browser';
  map.innerHTML = error;
  throw new Error(error);
}

var source = new EventSource("/_sse");
source.addEventListener("message", function(event) {
  data = JSON.parse(event.data);
  tree = mergeChunks(data);

  makeNav(data);
  build(find(location.hash));
}, false);

if (data) {
  makeNav(data);
  build(find(location.hash));
}

function makeNav(data) {
  if (!data) return;

  var all = '<a id="all" href="#all" onclick="build(tree)">All</a>';
  var individual = data.map(function(item) {
    return '<a ' +
      'id="' + item.chunk + '" ' +
      'href="#' + item.chunk + '" ' +
      'onclick="build(find(\\'#' + item.chunk + '\\'))">' +
      item.chunk +
      '</a>';
  });
  var links = [all].concat(individual).join(' | ');
  nav.innerHTML = 'Chunks: ' + links;
}

function mergeChunks(data) {
  if (!data) return null;

  return data.reduce(function(tree, item) {
    for (var key in item.sizes) {
      tree[key] = item.sizes[key];
    }
    return tree;
  }, {});
}

function find(hash) {
  var chunk = hash.slice(1);
  if (chunk === 'all') {
    return tree;
  }
  return data.find(function(d) {
    return d.chunk === chunk
  })
  .sizes;
}

function newNode(name) {
  return {
    name: name,
    data: {
      '$area': 0,
    },
    children: [],
  };
}

function addNode(path, size) {
  var parts = path.replace(/^\\//, '').split('/');
  var node = treeData;
  node.data['$area'] += size;

  parts.forEach(function(part) {
    var child = node.children.find(function(child) {
      return child.name == part;
    });
    if (!child) {
      var child = newNode(part);
      node.children.push(child);
    }

    node = child;
    node.data['$area'] += size;
  });
}

function addSizeToTitle(node, total) {
  var size = node.data['$area'];
  var pct = 100.0 * size / total;
  node.name += ' • ' + size + ' • ' + pct.toFixed(1) + '%';
  node.children.forEach(function(x) {
    addSizeToTitle(x, total)
  });
}

function build(tree) {
  treeData = newNode('');

  for (var source in tree) {
    addNode(source, tree[source]);
  }
  addSizeToTitle(treeData, treeData.data['$area']);

  fitToSize();
}

function fitToSize() {
  map.style.top = nav.offsetHeight + 'px';
  if (treeData.data) appendTreemap(map, treeData);
}

window.addEventListener('resize', fitToSize);

  </script>
  </body>
</html>
  `;
}
