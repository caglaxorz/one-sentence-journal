import React from 'react';
import { logger } from './logger';
import { FirebaseCrashlytics } from '@capacitor-firebase/crashlytics';

/**
 * Error Boundary Component
 * Catches React errors and provides fallback UI
 * Automatically reports crashes to Firebase Crashlytics
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error locally
    logger.error('React Error Boundary caught an error:', error);
    logger.error('Component stack:', errorInfo.componentStack);

    // Store error details for display
    this.setState({
      error,
      errorInfo
    });

    // Report crash to Firebase Crashlytics
    FirebaseCrashlytics.recordException({
      message: error.toString(),
      stacktrace: errorInfo.componentStack || error.stack || 'No stack trace available'
    }).catch(err => {
      logger.error('Failed to report crash to Firebase:', err);
    });
  }

  handleReload = () => {
    // Clear error state and reload
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      const isDarkMode = localStorage.getItem('journal_theme') !== 'light';

      return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
          <div className={`max-w-lg w-full rounded-2xl shadow-xl p-8 ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}>
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">😕</div>
              <h1 className="text-2xl font-bold mb-2">Oops! Something went wrong</h1>
              <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                The app encountered an unexpected error. Don't worry - your journal entries are safe.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={this.handleReload}
                className={`w-full py-3 rounded-xl font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-indigo-500 hover:bg-indigo-600 text-white' 
                    : 'bg-rose-500 hover:bg-rose-600 text-white'
                }`}
              >
                Reload App
              </button>

              <button
                onClick={() => window.open('mailto:hello@walruscreativeworks.com?subject=One%20Sentence%20Journal%20Error')}
                className={`w-full py-3 rounded-xl font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
                }`}
              >
                Contact Support
              </button>
            </div>

            {/* Error details (only shown in development) */}
            {import.meta.env.MODE === 'development' && error && (
              <details className={`mt-6 p-4 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                <summary className="cursor-pointer text-sm font-medium mb-2">
                  Error Details (Dev Mode)
                </summary>
                <div className="text-xs font-mono space-y-2">
                  <div>
                    <strong>Error:</strong>
                    <pre className="mt-1 whitespace-pre-wrap break-words">{error.toString()}</pre>
                  </div>
                  {errorInfo && errorInfo.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap break-words text-[10px]">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <p className={`mt-6 text-xs text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              This error has been automatically reported to our development team.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
