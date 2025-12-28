import { LocalNotifications } from '@capacitor/local-notifications';
import { logger } from './logger';

/**
 * Request notification permissions from the user
 * @returns {Promise<boolean>} True if permission granted
 */
export const requestNotificationPermission = async () => {
  try {
    const result = await LocalNotifications.requestPermissions();
    logger.log('Notification permission result:', result);
    return result.display === 'granted';
  } catch (error) {
    logger.error('Failed to request notification permission:', error);
    return false;
  }
};

/**
 * Check if notifications are currently enabled
 * @returns {Promise<boolean>}
 */
export const checkNotificationPermission = async () => {
  try {
    const result = await LocalNotifications.checkPermissions();
    return result.display === 'granted';
  } catch (error) {
    logger.error('Failed to check notification permission:', error);
    return false;
  }
};

/**
 * Schedule daily journaling reminder
 * @param {number} hour - Hour of day (0-23)
 * @param {number} minute - Minute of hour (0-59)
 * @returns {Promise<boolean>} Success status
 */
export const scheduleDailyReminder = async (hour = 20, minute = 0) => {
  try {
    // Cancel any existing reminders first
    await cancelDailyReminder();
    
    const hasPermission = await checkNotificationPermission();
    if (!hasPermission) {
      logger.warn('Cannot schedule reminder: no notification permission');
      return false;
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1,
          title: 'Time to Reflect ✨',
          body: 'How did today feel in one sentence?',
          schedule: {
            on: {
              hour,
              minute
            },
            allowWhileIdle: true,
            repeats: true
          },
          sound: 'default',
          smallIcon: 'ic_stat_icon_config_sample',
          actionTypeId: '',
          extra: null
        }
      ]
    });

    // Store reminder settings
    localStorage.setItem('reminder_enabled', 'true');
    localStorage.setItem('reminder_hour', hour.toString());
    localStorage.setItem('reminder_minute', minute.toString());
    
    logger.log(`Daily reminder scheduled for ${hour}:${minute.toString().padStart(2, '0')}`);
    return true;
  } catch (error) {
    logger.error('Failed to schedule daily reminder:', error);
    return false;
  }
};

/**
 * Cancel all scheduled reminders
 * @returns {Promise<boolean>}
 */
export const cancelDailyReminder = async () => {
  try {
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
    localStorage.setItem('reminder_enabled', 'false');
    logger.log('Daily reminder cancelled');
    return true;
  } catch (error) {
    logger.error('Failed to cancel daily reminder:', error);
    return false;
  }
};

/**
 * Get optimal reminder time based on user's journaling habits
 * @param {Array} entries - User's journal entries
 * @returns {{hour: number, minute: number}} Suggested time
 */
export const getOptimalReminderTime = (entries) => {
  if (!entries || entries.length === 0) {
    return { hour: 20, minute: 0 }; // Default: 8 PM
  }

  // Get entries with timestamps
  const entriesWithTime = entries
    .filter(e => e.createdAt)
    .map(e => new Date(e.createdAt));

  if (entriesWithTime.length === 0) {
    return { hour: 20, minute: 0 };
  }

  // Calculate average hour
  const avgHour = Math.round(
    entriesWithTime.reduce((sum, d) => sum + d.getHours(), 0) / entriesWithTime.length
  );

  // Suggest 1 hour before average journaling time
  const suggestedHour = avgHour > 0 ? avgHour - 1 : 23;

  return { hour: suggestedHour, minute: 0 };
};

/**
 * Get current reminder settings
 * @returns {{enabled: boolean, hour: number, minute: number}}
 */
export const getReminderSettings = () => {
  return {
    enabled: localStorage.getItem('reminder_enabled') === 'true',
    hour: parseInt(localStorage.getItem('reminder_hour') || '20'),
    minute: parseInt(localStorage.getItem('reminder_minute') || '0')
  };
};
