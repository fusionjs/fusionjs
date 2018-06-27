/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

import {configure} from 'enzyme';
// We do not list enzyme-adapter-react-15 in our dependencies as this breaks peerDeps
// for all Fusion.js apps using React 16. Instead we allow apps to manually install
// this package for React 15 support.
/* eslint-disable import/no-unresolved */
// $FlowFixMe
import Adapter from 'enzyme-adapter-react-15';
/* eslint-enable import/no-unresolved */

// Setup Enzyme for all Jest tests
configure({adapter: new Adapter()});
