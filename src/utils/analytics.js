import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { logger } from './logger';

/**
 * Analytics utility for tracking user behavior and app performance
 * Uses Firebase Analytics for iOS native tracking
 */

class Analytics {
  /**
   * Track app open event
   */
  static async trackAppOpen() {
    try {
      await FirebaseAnalytics.logEvent({
        name: 'app_open',
        params: {
          timestamp: new Date().toISOString()
        }
      });
      logger.log('Analytics: app_open');
    } catch (error) {
      logger.error('Failed to track app_open:', error);
    }
  }

  /**
   * Track user sign up
   * @param {string} method - Sign up method (email, google)
   */
  static async trackSignUp(method = 'email') {
    try {
      await FirebaseAnalytics.logEvent({
        name: 'sign_up',
        params: {
          method,
          timestamp: new Date().toISOString()
        }
      });
      logger.log('Analytics: sign_up', method);
    } catch (error) {
      logger.error('Failed to track sign_up:', error);
    }
  }

  /**
   * Track email verification
   */
  static async trackEmailVerified() {
    try {
      await FirebaseAnalytics.logEvent({
        name: 'email_verified',
        params: {
          timestamp: new Date().toISOString()
        }
      });
      logger.log('Analytics: email_verified');
    } catch (error) {
      logger.error('Failed to track email_verified:', error);
    }
  }

  /**
   * Track login event
   * @param {string} method - Login method (email, google)
   */
  static async trackLogin(method = 'email') {
    try {
      await FirebaseAnalytics.logEvent({
        name: 'login',
        params: {
          method,
          timestamp: new Date().toISOString()
        }
      });
      logger.log('Analytics: login', method);
    } catch (error) {
      logger.error('Failed to track login:', error);
    }
  }

  /**
   * Track entry creation
   * @param {string} mood - Mood emoji selected
   * @param {number} textLength - Length of entry text
   */
  static async trackEntryCreated(mood, textLength = 0) {
    try {
      await FirebaseAnalytics.logEvent({
        name: 'entry_created',
        params: {
          mood,
          text_length: textLength,
          timestamp: new Date().toISOString()
        }
      });
      logger.log('Analytics: entry_created', mood, textLength);
    } catch (error) {
      logger.error('Failed to track entry_created:', error);
    }
  }

  /**
   * Track entry edit
   * @param {string} mood - Mood emoji selected
   * @param {number} textLength - Length of entry text
   */
  static async trackEntryEdited(mood, textLength = 0) {
    try {
      await FirebaseAnalytics.logEvent({
        name: 'entry_edited',
        params: {
          mood,
          text_length: textLength,
          timestamp: new Date().toISOString()
        }
      });
      logger.log('Analytics: entry_edited', mood, textLength);
    } catch (error) {
      logger.error('Failed to track entry_edited:', error);
    }
  }

  /**
   * Track mood selection
   * @param {string} mood - Mood emoji selected
   */
  static async trackMoodSelected(mood) {
    try {
      await FirebaseAnalytics.logEvent({
        name: 'mood_selected',
        params: {
          mood,
          timestamp: new Date().toISOString()
        }
      });
      logger.log('Analytics: mood_selected', mood);
    } catch (error) {
      logger.error('Failed to track mood_selected:', error);
    }
  }

  /**
   * Track streak achievement
   * @param {number} streakDays - Number of days in streak
   */
  static async trackStreakAchieved(streakDays) {
    try {
      await FirebaseAnalytics.logEvent({
        name: 'streak_achieved',
        params: {
          streak_days: streakDays,
          timestamp: new Date().toISOString()
        }
      });
      logger.log('Analytics: streak_achieved', streakDays);
    } catch (error) {
      logger.error('Failed to track streak_achieved:', error);
    }
  }

  /**
   * Track PDF export
   * @param {number} entriesCount - Number of entries exported
   */
  static async trackPDFExported(entriesCount = 0) {
    try {
      await FirebaseAnalytics.logEvent({
        name: 'pdf_exported',
        params: {
          entries_count: entriesCount,
          timestamp: new Date().toISOString()
        }
      });
      logger.log('Analytics: pdf_exported', entriesCount);
    } catch (error) {
      logger.error('Failed to track pdf_exported:', error);
    }
  }

  /**
   * Track view change
   * @param {string} viewName - Name of the view (dashboard, calendar, list, profile)
   */
  static async trackViewChange(viewName) {
    try {
      await FirebaseAnalytics.logEvent({
        name: 'screen_view',
        params: {
          screen_name: viewName,
          timestamp: new Date().toISOString()
        }
      });
      logger.log('Analytics: screen_view', viewName);
    } catch (error) {
      logger.error('Failed to track screen_view:', error);
    }
  }

  /**
   * Track account deletion
   */
  static async trackAccountDeleted() {
    try {
      await FirebaseAnalytics.logEvent({
        name: 'account_deleted',
        params: {
          timestamp: new Date().toISOString()
        }
      });
      logger.log('Analytics: account_deleted');
    } catch (error) {
      logger.error('Failed to track account_deleted:', error);
    }
  }

  /**
   * Set user ID for analytics
   * @param {string} userId - Firebase user ID
   */
  static async setUserId(userId) {
    try {
      await FirebaseAnalytics.setUserId({
        userId
      });
      logger.log('Analytics: set user ID');
    } catch (error) {
      logger.error('Failed to set user ID:', error);
    }
  }

  /**
   * Set user property
   * @param {string} name - Property name
   * @param {string} value - Property value
   */
  static async setUserProperty(name, value) {
    try {
      await FirebaseAnalytics.setUserProperty({
        name,
        value
      });
      logger.log('Analytics: set user property', name, value);
    } catch (error) {
      logger.error('Failed to set user property:', error);
    }
  }
}

export default Analytics;
