/**
 * Production-safe logger utility
 * Only logs in development mode to prevent sensitive data exposure
 * 
 * Security: Prevents console logs from exposing user emails, entry counts,
 * and other sensitive data in production builds
 */

const isDevelopment = import.meta.env.MODE === 'development';

export const logger = {
  /**
   * Log general information (only in development)
   * @param {...any} args - Arguments to log
   */
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log warnings (only in development)
   * @param {...any} args - Arguments to log
   */
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log errors (always logged but sanitized)
   * Errors are always logged for debugging but sensitive data is removed
   * @param {...any} args - Arguments to log
   */
  error: (...args) => {
    if (isDevelopment) {
      // In development, log everything for debugging
      console.error(...args);
    } else {
      // In production, sanitize to remove sensitive data
      const sanitized = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          return '[Object]';
        }
        return String(arg);
      });
      console.error(...sanitized);
    }
  },

  /**
   * Log debug information (only in development)
   * @param {...any} args - Arguments to log
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};
