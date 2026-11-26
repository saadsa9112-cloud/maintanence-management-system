/**
 * Firebase Firestore Real-Time 2-Way Sync Engine
 * Enables seamless live data synchronization between PC and Mobile devices
 * with device-origin audit tracking (Mobile vs PC).
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { createSyncLogEntry, getDeviceFingerprint } from '../utils/deviceTracker';

const FIREBASE_CONFIG_STORAGE_KEY = 'amh_firebase_config_v1';
const SYNC_LOGS_STORAGE_KEY = 'amh_sync_activity_logs_v1';

let appInstance = null;
let firestoreInstance = null;
let unsubscribeSnapshot = null;

/**
 * Retrieves the stored or environment Firebase configuration
 */
export function getSavedFirebaseConfig() {
  try {
    const raw = localStorage.getItem(FIREBASE_CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.projectId && parsed.apiKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading saved firebase config:', e);
  }

  // Fallback to Vite environment variables if defined
  if (import.meta.env && import.meta.env.VITE_FIREBASE_API_KEY) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
    };
  }

  return null;
}

/**
 * Persists the Firebase configuration in localStorage
 */
export function saveFirebaseConfig(config) {
  try {
    if (!config) {
      localStorage.removeItem(FIREBASE_CONFIG_STORAGE_KEY);
      return false;
    }
    localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch (e) {
    console.error('Failed to save firebase config:', e);
    return false;
  }
}

/**
 * Initializes or re-initializes Firebase with the given config
 */
export function initFirebase(config = null) {
  const activeConfig = config || getSavedFirebaseConfig();
  if (!activeConfig || !activeConfig.apiKey || !activeConfig.projectId) {
    return null;
  }

  try {
    if (getApps().length === 0) {
      appInstance = initializeApp(activeConfig);
    } else {
      appInstance = getApp();
    }
    firestoreInstance = getFirestore(appInstance);
    return firestoreInstance;
  } catch (e) {
    console.error('Failed to initialize Firebase:', e);
    return null;
  }
}

/**
 * Retrieves local device sync history
 */
export function getStoredSyncLogs() {
  try {
    const raw = localStorage.getItem(SYNC_LOGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error reading sync logs:', e);
  }
  return [];
}

/**
 * Saves a sync log item locally and prepares it for cloud sync
 */
export function recordDeviceSyncLog(actionTitle, actionDetails = '', category = 'general') {
  const newLog = createSyncLogEntry(actionTitle, actionDetails, category);
  try {
    const currentLogs = getStoredSyncLogs();
    const updatedLogs = [newLog, ...currentLogs.filter(l => l.id !== newLog.id)].slice(0, 100);
    localStorage.setItem(SYNC_LOGS_STORAGE_KEY, JSON.stringify(updatedLogs));
    return { newLog, updatedLogs };
  } catch (e) {
    console.warn('Could not record sync log:', e);
    return { newLog, updatedLogs: [newLog] };
  }
}

/**
 * Subscribes to real-time changes from the cloud Firestore document.
 * Invoked on app startup so PC receives Mobile edits and vice versa.
 */
export function subscribeToCloudBuildingData(onRemoteUpdate, onSyncStatusChange) {
  const db = firestoreInstance || initFirebase();
  if (!db) {
    if (onSyncStatusChange) onSyncStatusChange('unconfigured');
    return () => {};
  }

  if (unsubscribeSnapshot) {
    unsubscribeSnapshot();
    unsubscribeSnapshot = null;
  }

  if (onSyncStatusChange) onSyncStatusChange('connecting');

  const buildingDocRef = doc(db, 'buildings', 'al_mustafa_heights');

  unsubscribeSnapshot = onSnapshot(
    buildingDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const cloudPayload = snapshot.data();
        if (cloudPayload && cloudPayload.data) {
          if (onSyncStatusChange) onSyncStatusChange('synced');
          if (onRemoteUpdate) {
            onRemoteUpdate({
              data: cloudPayload.data,
              lastModifiedDevice: cloudPayload.lastModifiedDevice || null,
              lastModifiedAt: cloudPayload.lastModifiedAt || null,
              syncLogs: cloudPayload.syncLogs || []
            });
          }
        }
      } else {
        if (onSyncStatusChange) onSyncStatusChange('empty_cloud');
      }
    },
    (error) => {
      console.error('Firestore real-time subscription error:', error);
      if (onSyncStatusChange) onSyncStatusChange('error', error);
    }
  );

  return () => {
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
      unsubscribeSnapshot = null;
    }
  };
}

/**
 * Pushes updated building state to Firestore along with device fingerprint and sync log.
 */
export async function pushDataToCloud(fullData, actionTitle = 'Data Updated', actionDetails = '') {
  const db = firestoreInstance || initFirebase();
  if (!db) {
    // If Firebase is not configured, just record locally
    const { newLog } = recordDeviceSyncLog(actionTitle, actionDetails);
    return { success: false, mode: 'local_only', log: newLog };
  }

  const { newLog, updatedLogs } = recordDeviceSyncLog(actionTitle, actionDetails);
  const currentDevice = getDeviceFingerprint();

  try {
    const buildingDocRef = doc(db, 'buildings', 'al_mustafa_heights');
    
    // Merge cloud syncLogs if available
    const payload = {
      data: fullData,
      lastModifiedAt: new Date().toISOString(),
      lastModifiedDevice: currentDevice,
      syncLogs: updatedLogs.slice(0, 50),
      serverUpdated: serverTimestamp()
    };

    await setDoc(buildingDocRef, payload, { merge: true });
    return { success: true, mode: 'cloud_synced', log: newLog };
  } catch (error) {
    console.error('Failed to push data to Firestore:', error);
    return { success: false, mode: 'error', error, log: newLog };
  }
}
