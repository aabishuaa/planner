# Google Authentication Setup Guide

This guide will help you enable Google Sign-In for Abishua's Planner.

## Prerequisites

- A Firebase project (you already have this set up)
- Access to the Firebase Console

## Step 1: Enable Google Authentication in Firebase

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **planner-7f03e**
3. Click on **Authentication** in the left sidebar
4. Click on the **Sign-in method** tab
5. Click on **Google** in the list of providers
6. Toggle the **Enable** switch to ON
7. Select a **Project support email** (your email address)
8. Click **Save**

## Step 2: (Optional) Enable Email/Password Authentication

If you want to allow users to sign up with email and password:

1. In the **Sign-in method** tab, click on **Email/Password**
2. Toggle the **Enable** switch to ON
3. Click **Save**

## Step 3: Update Firebase Database Rules

To ensure users can only access their own data:

1. Go to **Realtime Database** in the Firebase Console
2. Click on the **Rules** tab
3. Replace the existing rules with:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

4. Click **Publish**

## Step 4: Test the Authentication

1. Open `auth.html` in your browser
2. Try signing in with Google (popup should appear)
3. After authentication, you should be redirected to `index.html`
4. Your data should now be linked to your Google account
5. Try signing out and signing back in on a different device - your data should persist!

## Features Included

✅ **Beautiful Login Page** with smooth animations
✅ **Color Inversion Effect** when toggling between Login and Signup
✅ **Google Sign-In Popup** - seamless authentication
✅ **Email/Password Authentication** - alternative sign-in method
✅ **Password Strength Indicator** - helps create secure passwords
✅ **User Profile Display** - shows name and avatar in the app
✅ **Cross-Device Sync** - access your data from any device
✅ **Secure Sign-Out** - with confirmation dialog

## How It Works

1. **First Time Users**: When you first sign in with Google, your data is saved to Firebase under your user ID
2. **Returning Users**: When you sign in again (even on a different device), your data is automatically loaded
3. **Anonymous Data Migration**: If you had data before authentication, it will be automatically migrated to your account
4. **Real-time Sync**: All changes are automatically saved to Firebase

## Troubleshooting

**Problem**: "popup-closed-by-user" error
**Solution**: Make sure popups are not blocked in your browser

**Problem**: Authentication doesn't work
**Solution**: Check that Google Sign-In is enabled in Firebase Console

**Problem**: Data doesn't sync
**Solution**: Check your database rules and ensure they allow authenticated users to read/write

## Security Notes

- Your data is protected by Firebase Authentication
- Only you can access your own data
- Google handles the authentication securely
- Passwords are encrypted and never stored in plain text

## Support

If you encounter any issues, check the browser console for error messages.

---

**Enjoy your new authenticated planner! 🎉**
