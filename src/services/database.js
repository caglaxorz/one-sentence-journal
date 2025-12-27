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

/**
 * Subscribe to real-time updates for user's journal entries
 * @param {string} userId - The user's UID
 * @param {Function} callback - Callback function to receive entries
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToEntries = (userId, callback) => {
  if (!userId) {
    console.error('subscribeToEntries: userId is required');
    return () => {};
  }

  const entriesRef = collection(db, 'users', userId, 'entries');
  const q = query(entriesRef, orderBy('timestamp', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const entries = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        entries.push({
          id: doc.id,
          ...data,
          // Convert Firestore Timestamp to milliseconds
          timestamp: data.timestamp?.toMillis?.() || data.timestamp || Date.now(),
        });
      });
      callback(entries);
    },
    (error) => {
      console.error('Error fetching entries:', error);
      callback([]);
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
      console.error('Failed to migrate entry:', entry.date, error);
      errorCount++;
    }
  }

  return { success: successCount, errors: errorCount };
};
