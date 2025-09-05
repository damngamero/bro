import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'recipesavvy-fspvn',
  appId: '1:560392336050:web:bc5ce667a2784b398d8fab',
  storageBucket: 'recipesavvy-fspvn.appspot.com',
  apiKey: 'AIzaSyAYhYLrLJoknrqwDUkjlsImO0Y0EcUIROM',
  authDomain: 'recipesavvy-fspvn.firebaseapp.com',
  messagingSenderId: '560392336050',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
