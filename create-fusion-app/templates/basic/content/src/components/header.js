// @flow
import React, {Component} from 'react';

import {Link} from 'fusion-plugin-react-router';

export default class Header extends Component<any, any> {
  render() {
    return (
      <header>
        <h1>Welcome to Fusion.js</h1>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/styles">Styles</Link>
          </li>
          <li>
            <Link to="/404">404</Link>
          </li>
        </ul>
      </header>
    );
  }
}
