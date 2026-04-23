import { getApp, getApps, initializeApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth } from 'firebase/auth';
import config from 'config';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: config.firebaseApiKey,
  authDomain: 'dpk-flower.firebaseapp.com',
  projectId: 'dpk-flower',
  storageBucket: 'dpk-flower.firebasestorage.app',
  messagingSenderId: '761822600699',
  appId: '1:761822600699:web:f71dfbfdd63ec5379dff5e'
};

// Initialize Firebase
const fireStoreApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const googleAuthProvider = new GoogleAuthProvider();
const auth = getAuth(fireStoreApp);

// 👇 Force Google to show account selection every time
googleAuthProvider.setCustomParameters({
  prompt: 'select_account'
});

export { auth, googleAuthProvider };
