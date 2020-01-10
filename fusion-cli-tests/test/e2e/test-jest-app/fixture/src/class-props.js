// @noflow

import React, {Component} from 'react';

export default class ClassPropFixture {
  // The following flow annotation is required in order to reproduce the failing test case (#505)
  boundMethod: Function;

  constructor() {
    this.boundMethod = this.boundMethod.bind(this);
  }

  boundMethod(): void {}

  classProp = () => {
    return true;
  };
}
