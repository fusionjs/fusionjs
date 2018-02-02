import React, {Component} from 'react';
import PropTypes from 'prop-types';

export default class FontProvider extends Component {
  constructor(props, context) {
    super(props, context);
    this.getFontDetails = props.getFontDetails;
  }
  getChildContext() {
    return {
      getFontDetails: this.props.getFontDetails,
    };
  }
  render() {
    return React.Children.only(this.props.children);
  }
}

FontProvider.propTypes = {
  getFontDetails: PropTypes.func.isRequired,
  children: PropTypes.element.isRequired,
};
FontProvider.childContextTypes = {
  getFontDetails: PropTypes.func.isRequired,
};
