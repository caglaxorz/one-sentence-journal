// localStorage utility functions
// Centralizes storage operations to avoid code duplication

import { APP_CONSTANTS } from '../config/constants';

/**
 * Clear user data from localStorage
 * @param {string|null} userId - Optional user ID to clear specific user's data. If null, clears all journal data.
 * @returns {number} - Number of keys removed
 */
export const clearUserData = (userId = null) => {
  const keysToRemove = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    const patterns = [
      APP_CONSTANTS.STORAGE_KEYS.ENTRIES_PREFIX,
      APP_CONSTANTS.STORAGE_KEYS.USER_PREFIX
    ];
    
    const shouldRemove = patterns.some(pattern => {
      if (userId) {
        // Remove only specific user's data
        return key === `${pattern}${userId}`;
      }
      // Remove all data matching pattern
      return key.startsWith(pattern);
    });
    
    if (shouldRemove) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  return keysToRemove.length;
};
