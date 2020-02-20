// @noflow
import React from 'react';

const Home = () => {
  throw new Error('server-render-error');
  return null;
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {error: false};
  }
  static getDerivedStateFromError(e) {
    return {error: true};
  }
  render() {
    if (this.state.error) {
      return <div id="fallback"></div>;
    } else {
      return this.props.children;
    }
  }
}

export default () => (
  <ErrorBoundary>
    <Home />
  </ErrorBoundary>
);
