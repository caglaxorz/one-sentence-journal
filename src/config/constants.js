// Application-wide constants
// Centralizes magic numbers and hard-coded values for maintainability

export const APP_CONSTANTS = {
  // Entry validation
  ENTRY_MAX_LENGTH: 500,
  ENTRY_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 50,
  PROMPT_MAX_LENGTH: 200,
  
  // Rate limiting
  AUTH_MAX_ATTEMPTS: 5,
  AUTH_WINDOW_MS: 15 * 60 * 1000,  // 15 minutes
  PASSWORD_RESET_MAX_ATTEMPTS: 3,
  PASSWORD_RESET_WINDOW_MS: 60 * 60 * 1000,  // 1 hour
  
  // Analytics and stats
  STATS_WINDOW_DAYS: 30,
  
  // Storage keys
  STORAGE_PREFIX: 'journal_',
  STORAGE_KEYS: {
    THEME: 'journal_theme',
    PALETTE: 'journal_palette',
    CUSTOM_PALETTE: 'journal_custom_palette',
    ENTRIES_PREFIX: 'journal_entries_',
    USER_PREFIX: 'journal_user_',
  },
};
