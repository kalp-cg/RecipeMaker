import React from 'react';

/**
 * Error Boundary — catches uncaught render errors so the app doesn't white-screen.
 * Shows a friendly fallback UI instead of crashing.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('[ErrorBoundary] Caught:', error, info.componentStack);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh',
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#F0F2F5',
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😞</div>
                    <h2 style={{ marginBottom: '0.5rem', fontFamily: 'Inter, sans-serif' }}>
                        Something went wrong
                    </h2>
                    <p style={{ color: '#5C6B7F', marginBottom: '1.5rem', maxWidth: '400px', fontFamily: 'Inter, sans-serif' }}>
                        An unexpected error occurred. This usually fixes itself — try refreshing or click below.
                    </p>
                    <button
                        onClick={this.handleReset}
                        style={{
                            padding: '0.65rem 1.5rem',
                            background: 'linear-gradient(135deg, #FF6B35 0%, #E85A2A 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                        }}
                    >
                        Try Again
                    </button>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <pre style={{
                            marginTop: '1.5rem',
                            padding: '1rem',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            maxWidth: '500px',
                            overflow: 'auto',
                            textAlign: 'left',
                            color: '#FF5252',
                        }}>
                            {this.state.error.toString()}
                        </pre>
                    )}
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
