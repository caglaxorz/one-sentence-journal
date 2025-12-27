import { initializeApp } from 'firebase/app';
import { getAuth, indexedDBLocalPersistence, initializeAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { logger } from './utils/logger';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

logger.log('Firebase config:', {
  apiKey: firebaseConfig.apiKey ? '✓' : '✗',
  authDomain: firebaseConfig.authDomain ? '✓' : '✗',
  projectId: firebaseConfig.projectId ? '✓' : '✗',
  storageBucket: firebaseConfig.storageBucket ? '✓' : '✗',
  messagingSenderId: firebaseConfig.messagingSenderId ? '✓' : '✗',
  appId: firebaseConfig.appId ? '✓' : '✗',
});

const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Enable offline persistence for better UX
if (Capacitor.isNativePlatform()) {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      logger.warn('Persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      logger.warn('Persistence not available in this browser');
    }
  });
}

// Use memory-only persistence for iOS native to prevent WebView hangs
export const auth = Capacitor.isNativePlatform()
  ? initializeAuth(app, {
      persistence: indexedDBLocalPersistence
    })
  : getAuth(app);

logger.log('Auth initialized for platform:', Capacitor.getPlatform());
