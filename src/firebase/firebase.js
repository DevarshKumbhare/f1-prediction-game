// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDKyN8W0xczuFrpDQW1YC_0RDuyMkH2z0M",
  authDomain: "f1-prediction-fdc7c.firebaseapp.com",
  databaseURL: "https://f1-prediction-fdc7c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "f1-prediction-fdc7c",
  storageBucket: "f1-prediction-fdc7c.firebasestorage.app",
  messagingSenderId: "365967219620",
  appId: "1:365967219620:web:23edf85b4eebec4f73bf31",
  measurementId: "G-W2VT9PL1DR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

// Session Timeout Logic
const SESSION_TIMEOUT = 30 * 60 * 1000;

const setSessionTimeout = () => {
  const expirationTime = Date.now() + SESSION_TIMEOUT;
  localStorage.setItem("sessionExpiration", expirationTime);
  console.log("Timeout at:",expirationTime, "Now: ", Date.now())
};

const checkSessionTimeout = () => {
  const expirationTime = localStorage.getItem("sessionExpiration");
  if (expirationTime && Date.now() > expirationTime) {
    signOut(auth)
      .then(() => {
        console.log("Session expired. User signed out.");
      })
      .catch((error) => {
        console.error("Error signing out after session timeout:", error);
      });
  }
};

// Listen to auth state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User signed in:", user.email);
    setSessionTimeout(); // Reset session timer on login
  } else {
    console.log("User signed out.");
    localStorage.removeItem("sessionExpiration"); // Clear session on logout
  }
});

// Check session timeout periodically
setInterval(() => {
  checkSessionTimeout();
}, 1000 * 60); // Check every minute

export { app, auth };
