import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase.js';

/**
 * Hook to sync habit data with Firestore
 * CRITICAL: Distinguishes "user has no data" from "error reading data"
 * to prevent overwriting existing data on connection failures.
 */
export function useHabitData(userId) {
  const [data, setData] = useState(undefined); // undefined = not loaded, null = confirmed empty
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const hasReceivedData = useRef(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    hasReceivedData.current = false;
    setLoading(true);
    setError(false);

    const docRef = doc(db, 'users', userId, 'data', 'habits');

    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setData(snap.data());
        hasReceivedData.current = true;
      } else {
        // Only set null (triggering defaults) if we've never had data before
        // This prevents overwrite when Firestore temporarily returns empty
        if (!hasReceivedData.current) {
          setData(null); // Confirmed: user truly has no data yet
        }
      }
      setError(false);
      setLoading(false);
    }, (err) => {
      console.error('Firestore listen error:', err);
      // ON ERROR: keep existing data, set error flag, DO NOT set data to null
      setError(true);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  const save = useCallback(async (newData) => {
    if (!userId) return;
    setData(newData);
    hasReceivedData.current = true;
    try {
      const docRef = doc(db, 'users', userId, 'data', 'habits');
      await setDoc(docRef, {
        ...newData,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Firestore save error:', err);
    }
  }, [userId]);

  return { data, loading, error, save };
}

