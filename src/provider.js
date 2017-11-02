import React from 'react';
import PropTypes from 'prop-types';

export default {
  create: (name, BaseComponent = React.Component) => {
    class Provider extends BaseComponent {
      getChildContext() {
        return {[name]: this.props.service};
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
