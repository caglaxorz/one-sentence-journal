/**
 * Version Check Utility
 * Uses Firebase Remote Config to check if app needs updating
 */

import { getRemoteConfig, fetchAndActivate, getValue } from 'firebase/remote-config';
import { getApp } from 'firebase/app';
import { logger } from './logger';

/**
 * Compares semantic version strings
 * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
export const compareVersions = (v1, v2) => {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }
  
  return 0;
};

/**
 * Check if app requires or recommends an update
 * @returns {Promise<Object>} Update status object
 */
export const checkForUpdate = async () => {
  try {
    const app = getApp();
    const remoteConfig = getRemoteConfig(app);
    
    // Set config settings
    remoteConfig.settings = {
      minimumFetchIntervalMillis: 3600000, // 1 hour
      fetchTimeoutMillis: 10000, // 10 seconds
    };
    
    // Set default config values
    remoteConfig.defaultConfig = {
      ios_min_version: '1.0.0',
      ios_recommended_version: '1.0.0',
      force_update: 'false',
      update_message: 'A new version of the app is available with improvements and bug fixes.',
    };
    
    // Fetch and activate remote config
    await fetchAndActivate(remoteConfig);
    
    // Get current version from environment variable
    const currentVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';
    
    // Get remote config values
    const minVersion = getValue(remoteConfig, 'ios_min_version').asString();
    const recommendedVersion = getValue(remoteConfig, 'ios_recommended_version').asString();
    const forceUpdate = getValue(remoteConfig, 'force_update').asString() === 'true';
    const updateMessage = getValue(remoteConfig, 'update_message').asString();
    
    // Check if update is required (current version < minimum version)
    const isUpdateRequired = compareVersions(currentVersion, minVersion) < 0;
    
    // Check if update is recommended (current version < recommended version)
    const isUpdateRecommended = compareVersions(currentVersion, recommendedVersion) < 0;
    
    // Determine if we should show update prompt
    const shouldShowUpdate = forceUpdate ? isUpdateRequired : isUpdateRecommended;
    
    if (!shouldShowUpdate) {
      return {
        required: false,
        recommended: false,
        message: null,
        updateUrl: null,
      };
    }
    
    return {
      required: isUpdateRequired || forceUpdate,
      recommended: isUpdateRecommended,
      message: updateMessage,
      updateUrl: 'itms-apps://itunes.apple.com/app/id[YOUR_APP_ID]', // TODO: Replace with actual App Store ID
      currentVersion,
      minVersion,
      recommendedVersion,
    };
  } catch (error) {
    logger.error('Error checking for update:', error);
    
    // Don't block the app if remote config fails
    return {
      required: false,
      recommended: false,
      message: null,
      updateUrl: null,
      error: error.message,
    };
  }
};

/**
 * Log update check to analytics
 */
export const logUpdateCheck = (updateStatus) => {
  try {
    const { Analytics } = window;
    if (Analytics && Analytics.logEvent) {
      Analytics.logEvent('update_check', {
        required: updateStatus.required,
        recommended: updateStatus.recommended,
        current_version: updateStatus.currentVersion,
        min_version: updateStatus.minVersion,
        recommended_version: updateStatus.recommendedVersion,
      });
    }
  } catch (error) {
    logger.error('Error logging update check:', error);
  }
};
