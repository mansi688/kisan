import React from 'react';
import SystemError from './SystemError.jsx';

/**
 * React only supports error boundaries as class components — there's no
 * hook equivalent for componentDidCatch/getDerivedStateFromError. Wraps the
 * whole app (see App.jsx) so an unhandled render error anywhere shows the
 * branded SystemError screen instead of React's default: unmounting the
 * entire tree, which leaves a blank white page with no explanation.
 *
 * The actual error and component stack go to console.error only — never
 * into the rendered UI. A person looking at the SystemError screen sees
 * "Something went wrong", never a stack trace, a file path, or a raw
 * exception message.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this.handleRetry = this.handleRetry.bind(this);
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Unhandled render error:', error, info.componentStack);
  }

  handleRetry() {
    this.setState({ hasError: false });
  }

  render() {
    if (this.state.hasError) {
      return <SystemError onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}
