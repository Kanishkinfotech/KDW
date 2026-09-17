import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import './api/apiClient'
import App from './App.tsx'
import React from 'react'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import { SettingsProvider } from './context/SettingsContext'

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any, errorInfo: any}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'left', color: '#ef4444', backgroundColor: '#0f172a', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', fontFamily: 'sans-serif' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 'bold' }}>Something went wrong.</h1>
          <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Please try refreshing the page or copy the error below.</p>
          
          <div style={{ background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '8px', overflowX: 'auto', color: '#f87171' }}>
            <h3 style={{fontWeight: 'bold', marginBottom: '0.5rem'}}>Error Message:</h3>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
            
            {this.state.errorInfo && (
              <>
                <h3 style={{fontWeight: 'bold', marginTop: '1rem', marginBottom: '0.5rem'}}>Component Stack:</h3>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>{this.state.errorInfo.componentStack}</pre>
              </>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <SettingsProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <App />
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </SettingsProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>,
)
