// Firestore database operations for journal entries
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebaseClient';
import { sanitizeText } from '../utils/security';
import { logger } from '../utils/logger';

/**
 * Subscribe to real-time updates for user's journal entries
 * @param {string} userId - The user's UID
 * @param {Function} callback - Callback function to receive entries
 * @param {Function} errorCallback - Optional callback for error handling with user message
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToEntries = (userId, callback, errorCallback) => {
  if (!userId) {
    const error = new Error('User ID is required for subscribeToEntries');
    logger.error(error);
    if (errorCallback) errorCallback(error, 'User ID is required');
    return () => {};
  }

  const entriesRef = collection(db, 'users', userId, 'entries');
  const q = query(entriesRef, orderBy('timestamp', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const entries = [];
      const validationErrors = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Validate required fields
        if (!data.timestamp) {
          validationErrors.push(`Entry ${doc.id} missing timestamp`);
          return;
        }
        
        if (!data.mood || !data.date) {
          validationErrors.push(`Entry ${doc.id} missing required fields (mood or date)`);
          return;
        }
        
        // Only add valid entries
        entries.push({
          id: doc.id,
          ...data,
          // Convert Firestore Timestamp to milliseconds (no fallback)
          timestamp: data.timestamp.toMillis(),
        });
      });
      
      // Report validation errors in development
      if (validationErrors.length > 0) {
        logger.warn('Entry validation errors:', validationErrors);
      }
      
      callback(entries);
    },
    (error) => {
      logger.error('Error fetching entries:', error);
      
      // Provide specific error information to user
      let userMessage = 'Failed to load entries. ';
      
      if (error.code === 'permission-denied') {
        userMessage += 'Please check your permissions or try logging in again.';
      } else if (error.code === 'unavailable') {
        userMessage += 'Network connection lost. Will retry automatically.';
      } else {
        userMessage += 'An unexpected error occurred.';
      }
      
      // Call error callback if provided, otherwise fallback to empty array
      if (errorCallback) {
        errorCallback(error, userMessage);
      } else {
        callback([]);
      }
    }
  );
};

/**
 * Save or update a journal entry
 * @param {string} userId - The user's UID
 * @param {Object} entry - The journal entry object
 * @returns {Promise<void>}
 */
export const saveEntry = async (userId, entry) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  if (!entry.date) {
    throw new Error('Entry date is required');
  }

  if (!entry.mood) {
    throw new Error('Mood is required');
  }

  // Sanitize text content
  const sanitizedText = sanitizeText(entry.text || '');

  // Validate text length
  if (sanitizedText.length > 500) {
    throw new Error('Entry text is too long (max 500 characters)');
  }

  // Use date as document ID for easy retrieval and updates
  const entryRef = doc(db, 'users', userId, 'entries', entry.date);

  const entryData = {
    date: entry.date,
    text: sanitizedText,
    mood: entry.mood,
    mattered: entry.mattered || false,
    prompt: sanitizeText(entry.prompt || ''),
    userId: userId,
    timestamp: serverTimestamp(),
    createdAt: entry.createdAt || new Date().toISOString(), // Track when entry was actually created
    // Note: photos are not stored in Firestore for now to keep it simple
    // You can add Firebase Storage integration later if needed
  };

  await setDoc(entryRef, entryData, { merge: true });
};

/**
 * Delete a journal entry
 * @param {string} userId - The user's UID
 * @param {string} date - The date of the entry to delete (format: YYYY-MM-DD)
 * @returns {Promise<void>}
 */
export const deleteEntry = async (userId, date) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  if (!date) {
    throw new Error('Entry date is required');
  }

  const entryRef = doc(db, 'users', userId, 'entries', date);
  await deleteDoc(entryRef);
};

/**
 * Migrate entries from localStorage to Firestore (one-time migration)
 * @param {string} userId - The user's UID
 * @param {Array} entries - Array of entries from localStorage
 * @returns {Promise<Object>} - Migration result with success and error counts
 */
export const migrateLocalEntries = async (userId, entries) => {
  if (!userId || !entries || !Array.isArray(entries)) {
    return { success: 0, errors: 0 };
  }

  let successCount = 0;
  let errorCount = 0;

  for (const entry of entries) {
    try {
      await saveEntry(userId, entry);
      successCount++;
    } catch (error) {
      logger.error('Failed to migrate entry:', entry.date, error);
      errorCount++;
    }
  }

  return { success: successCount, errors: errorCount };
};
