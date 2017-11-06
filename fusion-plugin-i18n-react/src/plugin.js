import React from 'react';
import PropTypes from 'prop-types';
import i18n from 'fusion-plugin-i18n';
import {ProviderPlugin} from 'fusion-react';

class BundleSplitConsumer extends React.Component {
  constructor(props, context) {
    super(props, context);
    // splitComponentLoaders comes from fusion-react-async/prepare-provider
    // ids comes from fusion-react-async/split
    // props.service comes from fusion-react/plugin and references i18n()
    if (context.splitComponentLoaders) {
      context.splitComponentLoaders.push(ids => props.service.load(ids));
    }
  }
}
BundleSplitConsumer.contextTypes = {
  splitComponentLoaders: PropTypes.array,
};

export default ProviderPlugin.create('i18n', i18n, BundleSplitConsumer);
