import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase.js';

/**
 * BULLETPROOF Firestore hook.
 * Rule #1: NEVER write defaults unless getDoc confirms no document exists.
 * Rule #2: On ANY error, keep local data — never touch Firestore.
 */
export function useHabitData(userId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const confirmedExists = useRef(false);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    confirmedExists.current = false;
    setIsNewUser(false);
    setLoading(true);
    setError(false);

    const docRef = doc(db, 'users', userId, 'data', 'habits');

    // Step 1: Do a one-time read FIRST to confirm if doc exists
    getDoc(docRef).then((snap) => {
      if (snap.exists()) {
        confirmedExists.current = true;
        setData(snap.data());
      } else {
        // Confirmed: document truly does not exist (new user)
        setIsNewUser(true);
      }
      setLoading(false);
    }).catch((err) => {
      console.error('Firestore initial read error:', err);
      setError(true);
      setLoading(false);
      // Do NOT set isNewUser — we don't know if data exists or not
    });

    // Step 2: Listen for real-time updates (but never trust it for "no data" decisions)
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        confirmedExists.current = true;
        setData(snap.data());
        setError(false);
      }
      // If snap doesn't exist but we've confirmed data before, IGNORE
      // This prevents the "temporary empty" glitch from wiping data
    }, (err) => {
      console.error('Firestore listen error:', err);
      // Keep whatever data we have — don't change anything
    });

    return unsubscribe;
  }, [userId]);

  const save = useCallback(async (newData) => {
    if (!userId) return;
    confirmedExists.current = true;
    setData(newData);
    try {
      const docRef = doc(db, 'users', userId, 'data', 'habits');
      await setDoc(docRef, { ...newData, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.error('Firestore save error:', err);
    }
  }, [userId]);

  return { data, loading, error, isNewUser, save };
}


