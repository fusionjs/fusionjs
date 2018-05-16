import React from 'react';

/**
 * Provides styletron instance via old context API
 */

class LegacyStyletronProvider extends React.Component {
  getChildContext() {
    return {styletron: this.styletron};
  }
  constructor(props, context) {
    super(props, context);
    this.styletron = props.value;
  }
  render() {
    return React.Children.only(this.props.children);
  }
}

LegacyStyletronProvider.childContextTypes = {
  styletron: noop,
};

export default LegacyStyletronProvider;

function noop() {}
