// Firebase Configuration Example
//
// INSTRUCTIONS:
// 1. Copy this file to firebase-config.js
// 2. Replace all placeholder values with your actual Firebase credentials
// 3. See FIREBASE_SETUP.md for detailed setup instructions
//
// Get your credentials from:
// https://console.firebase.google.com/ > Project Settings > Your apps

const firebaseConfig = {
    // Your Web API Key from Firebase Console
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",

    // Your Firebase Auth domain (usually your-project-id.firebaseapp.com)
    authDomain: "your-project-id.firebaseapp.com",

    // Your Realtime Database URL (found in Realtime Database section)
    databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",

    // Your Firebase Project ID
    projectId: "your-project-id",

    // Your Storage Bucket (usually your-project-id.appspot.com)
    storageBucket: "your-project-id.appspot.com",

    // Your Messaging Sender ID
    messagingSenderId: "123456789012",

    // Your App ID
    appId: "1:123456789012:web:abcdef123456"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Error initializing Firebase:', error);
    alert('Firebase configuration error. Please check firebase-config.js and follow the setup instructions in FIREBASE_SETUP.md');
}
