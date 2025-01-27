import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBwoUOSwdqY8dgRQtgmtZhV2vQh9210rbM',
  authDomain: 'calculus-qr-code-scanner.firebaseapp.com',
  projectId: 'calculus-qr-code-scanner',
  storageBucket: 'calculus-qr-code-scanner.firebasestorage.app',
  messagingSenderId: '1025962037329',
  appId: '1:1025962037329:web:cd3a2b88c8f63beaeaa870',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
