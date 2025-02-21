import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBt46VmcLjS91Y2bhKavDijg3Yjpq-N1dQ",
  authDomain: "dialogon-4.firebaseapp.com",
  projectId: "dialogon-4",
  storageBucket: "dialogon-4.firebasestorage.app",
  messagingSenderId: "93660630815",
  appId: "1:93660630815:web:c0d4d60bec007289d36a2a",
  measurementId: "G-K08F23Q55N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth and Google Provider
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: 'select_account'
});

export { auth, provider }; 