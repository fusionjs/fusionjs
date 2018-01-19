import React from 'react';
import PropTypes from 'prop-types';

export default {
  create: name => {
    class Provider extends React.Component {
      getChildContext() {
        return {[name]: this.props.provides};
      }
      render() {
        return React.Children.only(this.props.children);
      }
    }
    Provider.childContextTypes = {
      ...(Provider.childContextTypes || {}),
      [name]: PropTypes.object.isRequired,
    };
    Provider.displayName =
      name.replace(/^./, c => c.toUpperCase()) + 'Provider';

    return Provider;
  },
};
