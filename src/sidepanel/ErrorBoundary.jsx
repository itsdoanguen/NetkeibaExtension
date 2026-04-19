import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
          <h2>Error in Extension</h2>
          <p style={{ color: 'red' }}>{this.state.error?.toString()}</p>
          <details>
            <summary>Stack trace</summary>
            <pre style={{ fontSize: '11px', overflow: 'auto' }}>
              {this.state.error?.stack}
            </pre>
          </details>
          <p>Check browser console (F12) for more details.</p>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
