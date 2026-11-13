import { Component } from 'react';

/**
 * Keeps a failing WebGL scene (old GPU, lost context, blocked video) from
 * taking the whole page down: renders the static fallback instead.
 */
export default class SafeBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    if (import.meta.env.DEV) console.warn('[3D scene disabled]', error);
  }

  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}
