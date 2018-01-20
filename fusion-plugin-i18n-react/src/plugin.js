import React from 'react';
import PropTypes from 'prop-types';
import i18n from 'fusion-plugin-i18n';
import {ProviderPlugin} from 'fusion-react';

class BundleSplitConsumer extends React.Component {
  constructor(props, context) {
    super(props, context);
    // splitComponentLoaders comes from fusion-react-async/prepare-provider
    // ids comes from fusion-react-async/split
    // props.provides comes from fusion-react/plugin and references i18n()
    this.i18n = props.provides.from(props.ctx);
    if (context.splitComponentLoaders) {
      context.splitComponentLoaders.push(ids => this.i18n.load(ids));
    }
  }
  getChildContext() {
    return {i18n: this.props.provides.from(this.props.ctx)};
  }
  render() {
    return React.Children.only(this.props.children);
  }
}
BundleSplitConsumer.contextTypes = {
  splitComponentLoaders: PropTypes.array,
};
BundleSplitConsumer.childContextTypes = {
  i18n: PropTypes.object.isRequired,
};

export default ProviderPlugin.create('i18n', i18n, BundleSplitConsumer);
