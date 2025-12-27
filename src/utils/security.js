// Input sanitization and validation utilities
import DOMPurify from 'dompurify';

/**
 * Sanitizes text input to prevent XSS attacks
 * Uses DOMPurify for industry-standard protection against:
 * - HTML tag injection
 * - Attribute injection (onerror, onclick, etc.)
 * - HTML entity bypasses
 * - Unicode bypasses
 * - JavaScript protocol injection
 * 
 * @param {string} text - The text to sanitize
 * @returns {string} - Sanitized text
 */
export const sanitizeText = (text) => {
  if (!text) return '';
  
  // DOMPurify removes ALL HTML and dangerous patterns
  // ALLOWED_TAGS: [] means strip ALL HTML tags
  // ALLOWED_ATTR: [] means strip ALL attributes
  // KEEP_CONTENT: true means keep the text content
  const clean = DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],  // Strip ALL tags
    ALLOWED_ATTR: [],  // Strip ALL attributes
    KEEP_CONTENT: true,  // Keep text content
  });
  
  // Additional length validation
  if (clean.length > 500) {
    throw new Error('Entry text is too long (max 500 characters)');
  }
  
  return clean.trim();
};

/**
 * Validates and sanitizes user name
 * @param {string} name - The name to validate
 * @returns {Object} - { isValid: boolean, error: string|null, sanitized: string }
 */
export const validateName = (name) => {
  if (!name || !name.trim()) {
    return { isValid: false, error: 'Name is required', sanitized: '' };
  }
  
  const trimmed = name.trim();
  const sanitized = sanitizeText(trimmed);
  
  if (sanitized.length > 50) {
    return { isValid: false, error: 'Name must be 50 characters or fewer', sanitized };
  }
  
  if (sanitized.length < 1) {
    return { isValid: false, error: 'Name must be at least 1 character', sanitized };
  }
  
  // Check for invalid characters (only allow letters, numbers, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z0-9\s\-']+$/.test(sanitized)) {
    return { isValid: false, error: 'Name contains invalid characters', sanitized };
  }
  
  return { isValid: true, error: null, sanitized };
};

/**
 * Validates password strength
 * @param {string} password - The password to validate
 * @returns {Object} - { isValid: boolean, error: string|null, strength: string }
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, error: 'Password is required', strength: 'none' };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long', strength: 'weak' };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    return { 
      isValid: false, 
      error: 'Password must include uppercase, lowercase, and a number', 
      strength: 'medium' 
    };
  }
  
  if (password.length < 12 && !hasSpecialChar) {
    return { 
      isValid: true, 
      error: null, 
      strength: 'good' 
    };
  }
  
  return { isValid: true, error: null, strength: 'strong' };
};

/**
 * Validates email format
 * @param {string} email - The email to validate
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }
  
  const trimmed = email.trim().toLowerCase();
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  return { isValid: true, error: null };
};

/**
 * Rate limiter for authentication attempts
 */
export class RateLimiter {
  constructor(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.attempts = new Map();
  }
  
  /**
   * Check if action is allowed
   * @param {string} key - Identifier for the rate limit (e.g., email)
   * @returns {Object} - { allowed: boolean, remainingAttempts: number, resetTime: number|null }
   */
  checkLimit(key) {
    const now = Date.now();
    const record = this.attempts.get(key);
    
    if (!record) {
      this.attempts.set(key, { count: 1, firstAttempt: now });
      return { allowed: true, remainingAttempts: this.maxAttempts - 1, resetTime: null };
    }
    
    // Check if window has expired
    if (now - record.firstAttempt > this.windowMs) {
      this.attempts.set(key, { count: 1, firstAttempt: now });
      return { allowed: true, remainingAttempts: this.maxAttempts - 1, resetTime: null };
    }
    
    // Check if limit exceeded
    if (record.count >= this.maxAttempts) {
      const resetTime = record.firstAttempt + this.windowMs;
      return { allowed: false, remainingAttempts: 0, resetTime };
    }
    
    // Increment counter
    record.count++;
    return { allowed: true, remainingAttempts: this.maxAttempts - record.count, resetTime: null };
  }
  
  /**
   * Reset attempts for a key
   * @param {string} key - Identifier to reset
   */
  reset(key) {
    this.attempts.delete(key);
  }
}
