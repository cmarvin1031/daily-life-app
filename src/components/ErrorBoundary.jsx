import { Component } from 'react';

// Last line of defense against a render-time crash: without this, one
// thrown error anywhere in the tree leaves a blank white page with no way
// to recover short of the user guessing to reload.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled render error', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="app-splash app-error">
        <div className="card app-error-card">
          <h2>Something went wrong</h2>
          <p className="text-muted">{this.state.error.message || 'An unexpected error occurred.'}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      </div>
    );
  }
}
