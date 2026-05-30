import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDm9ryI-31SSOsbh7ivMci9ER6Ewzif9M8",
  authDomain: "focus-mind-lab.firebaseapp.com",
  projectId: "focus-mind-lab",
  storageBucket: "focus-mind-lab.firebasestorage.app",
  messagingSenderId: "1059138940884",
  appId: "1:1059138940884:web:2d1a89a7fa274dbb3c3041"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);