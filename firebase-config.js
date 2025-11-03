// Firebase Configuration
// IMPORTANT: Replace these values with your own Firebase project credentials
// See FIREBASE_SETUP.md for detailed setup instructions

const firebaseConfig = {
  apiKey: "AIzaSyACd1AnwTfDdSJBLssg2aV3ck5bZk3powk",
  authDomain: "planner-7f03e.firebaseapp.com",
  projectId: "planner-7f03e",
  storageBucket: "planner-7f03e.firebasestorage.app",
  messagingSenderId: "453853615791",
  appId: "1:453853615791:web:3e22bbb3087aec7c7b665a",
  measurementId: "G-WPY9D01W3X"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Error initializing Firebase:', error);
    alert('Firebase configuration error. Please check firebase-config.js and follow the setup instructions in FIREBASE_SETUP.md');
}
