// User-friendly error modal component
import React from 'react';
import { Mail, RefreshCcw, X, AlertCircle, WifiOff, Lock, UserX, Clock, HardDrive } from 'lucide-react';

/**
 * Error Modal Component
 * Displays user-friendly error messages with actionable steps
 */
export const ErrorModal = ({ error, onClose, onRetry, isDarkMode }) => {
  if (!error) return null;

  const { type, title, message, actions, canRetry, canDismiss = true } = error;

  // Support email function
  const openSupportEmail = () => {
    const subject = encodeURIComponent('One Sentence Journal - Help Request');
    const body = encodeURIComponent(`
App Version: ${import.meta.env.VITE_APP_VERSION || '1.0.0'}
Error Type: ${type || 'Unknown'}
Error Message: ${message || 'No details'}

Please describe your issue:
    `);
    
    const mailtoUrl = `mailto:hello@walruscreativeworks.com?subject=${subject}&body=${body}`;
    window.open(mailtoUrl, '_blank');
  };

  // Icon based on error type
  const getIcon = () => {
    switch (type) {
      case 'network':
        return <WifiOff size={32} className="text-blue-500" />;
      case 'auth':
        return <Lock size={32} className="text-amber-500" />;
      case 'permission':
        return <UserX size={32} className="text-red-500" />;
      case 'rate-limit':
        return <Clock size={32} className="text-orange-500" />;
      case 'storage':
        return <HardDrive size={32} className="text-purple-500" />;
      default:
        return <AlertCircle size={32} className="text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className={`
          relative max-w-md w-full rounded-2xl p-6 shadow-2xl
          ${isDarkMode 
            ? 'bg-gray-800 text-white border border-gray-700' 
            : 'bg-white text-gray-900 border border-gray-200'
          }
        `}
      >
        {/* Close button (if dismissible) */}
        {canDismiss && (
          <button
            onClick={onClose}
            className={`
              absolute top-4 right-4 p-1 rounded-lg transition-colors
              ${isDarkMode 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              }
            `}
            aria-label="Close error message"
          >
            <X size={20} />
          </button>
        )}

        {/* Icon */}
        <div className="flex justify-center mb-4">
          {getIcon()}
        </div>

        {/* Title */}
        <h3 className={`
          text-xl font-bold text-center mb-3
          ${isDarkMode ? 'text-white' : 'text-gray-900'}
        `}>
          {title}
        </h3>

        {/* Message */}
        <p className={`
          text-center mb-4 leading-relaxed
          ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
        `}>
          {message}
        </p>

        {/* Action items (if any) */}
        {actions && actions.length > 0 && (
          <ul className={`
            text-sm mb-6 space-y-2
            ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
          `}>
            {actions.map((action, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          {/* Retry button */}
          {canRetry && onRetry && (
            <button
              onClick={onRetry}
              className={`
                w-full py-3 px-4 rounded-xl font-medium
                flex items-center justify-center gap-2
                transition-all duration-200
                ${isDarkMode
                  ? 'bg-rose-500 hover:bg-rose-600 text-white active:scale-95'
                  : 'bg-rose-500 hover:bg-rose-600 text-white active:scale-95'
                }
              `}
            >
              <RefreshCcw size={18} />
              Try Again
            </button>
          )}

          {/* Contact support button */}
          <button
            onClick={openSupportEmail}
            className={`
              w-full py-3 px-4 rounded-xl font-medium
              flex items-center justify-center gap-2
              transition-all duration-200
              ${isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white active:scale-95'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900 active:scale-95'
              }
            `}
          >
            <Mail size={18} />
            Contact Support
          </button>

          {/* Close button (if dismissible) */}
          {canDismiss && (
            <button
              onClick={onClose}
              className={`
                w-full py-2 px-4 rounded-xl font-medium
                transition-all duration-200
                ${isDarkMode
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Error type factory functions
 * Creates standardized error objects for different scenarios
 */

export const createNetworkError = (customMessage = null) => ({
  type: 'network',
  title: "Can't Connect Right Now",
  message: customMessage || "Your entry is saved locally, but we can't sync it to the cloud right now.",
  actions: [
    'Check your WiFi or cellular connection',
    'Try again in a few seconds',
    'Your entry is safe on this device'
  ],
  canRetry: true,
  canDismiss: true
});

export const createAuthError = (errorCode) => {
  const authErrors = {
    'auth/wrong-password': {
      title: 'Password Incorrect',
      message: "The password you entered doesn't match our records.",
      actions: ['Try again', 'Use "Forgot Password" to reset it']
    },
    'auth/user-not-found': {
      title: 'Account Not Found',
      message: 'No account exists with this email address.',
      actions: [
        'Double-check the email spelling',
        'Create a new account if you\'re new here'
      ]
    },
    'auth/too-many-requests': {
      title: 'Too Many Attempts',
      message: "For your security, we've temporarily locked this account.",
      actions: [
        'Wait 15 minutes, then try again',
        'Use "Forgot Password" to reset immediately'
      ]
    },
    'auth/invalid-email': {
      title: 'Invalid Email',
      message: 'The email address format is incorrect.',
      actions: ['Check for typos', 'Use a valid email like user@example.com']
    },
    'auth/email-already-in-use': {
      title: 'Email Already Registered',
      message: 'An account with this email already exists.',
      actions: ['Try logging in instead', 'Use "Forgot Password" if you forgot your credentials']
    },
    'auth/weak-password': {
      title: 'Weak Password',
      message: 'Your password needs to be stronger.',
      actions: ['Use at least 6 characters', 'Mix letters, numbers, and symbols']
    },
    'auth/requires-recent-login': {
      title: 'Session Expired',
      message: 'For your security, please log in again to continue.',
      actions: ['Log out and log back in', 'Then try this action again']
    },
    'auth/network-request-failed': {
      title: 'Connection Problem',
      message: "We couldn't reach the authentication server.",
      actions: [
        'Check your internet connection',
        'Try again in a moment',
        'Contact support if this persists'
      ]
    }
  };

  const error = authErrors[errorCode] || {
    title: 'Authentication Problem',
    message: 'We encountered an issue with your account.',
    actions: ['Try again', 'Contact support if this keeps happening']
  };

  return {
    type: 'auth',
    ...error,
    canRetry: true,
    canDismiss: true
  };
};

export const createStorageError = () => ({
  type: 'storage',
  title: 'Storage Running Low',
  message: 'Your device is running out of storage space.',
  actions: [
    'Export your entries as PDF to save them',
    'Free up space on your device',
    'Then try again'
  ],
  canRetry: true,
  canDismiss: true
});

export const createPermissionError = () => ({
  type: 'permission',
  title: 'Permission Denied',
  message: "You don't have permission to access this data.",
  actions: [
    'Make sure you\'re logged in',
    'Check your account permissions',
    'Try logging out and back in'
  ],
  canRetry: true,
  canDismiss: true
});

export const createRateLimitError = (waitMinutes = 15) => ({
  type: 'rate-limit',
  title: 'Please Slow Down',
  message: `You've made too many attempts. Please wait ${waitMinutes} minutes before trying again.`,
  actions: [
    `Take a ${waitMinutes}-minute break`,
    'This helps keep your account secure',
    'Contact support if you need immediate help'
  ],
  canRetry: false,
  canDismiss: true
});

export const createGenericError = (customTitle = null, customMessage = null) => ({
  type: 'generic',
  title: customTitle || 'Something Went Wrong',
  message: customMessage || 'We encountered an unexpected error. Your data is safe.',
  actions: [
    'Try again in a moment',
    'Contact support if this keeps happening',
    'Include details about what you were doing'
  ],
  canRetry: true,
  canDismiss: true
});

export const createValidationError = (field, requirement) => ({
  type: 'validation',
  title: 'Please Check Your Input',
  message: `${field} ${requirement}`,
  actions: [
    'Fix the issue and try again',
    'Contact support if you need help'
  ],
  canRetry: false,
  canDismiss: true
});
