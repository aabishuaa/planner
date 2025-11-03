/**
 * Firebase Service - Handles all Firebase Realtime Database operations
 * This service provides a clean API for storing and retrieving planner data
 */

class FirebaseService {
    constructor() {
        this.db = null;
        this.auth = null;
        this.userId = null;
        this.userDataRef = null;
        this.isInitialized = false;
        this.onDataChangeCallback = null;
        this.useLocalStorageFallback = false;
    }

    /**
     * Initialize Firebase service and authenticate user
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        try {
            // Check if Firebase is properly configured
            if (!firebase.apps.length) {
                console.error('Firebase is not initialized. Check firebase-config.js');
                this.useLocalStorageFallback = true;
                return false;
            }

            this.db = firebase.database();
            this.auth = firebase.auth();

            // Enable offline persistence
            this.db.goOffline();
            this.db.goOnline();

            // Sign in anonymously or use existing session
            await this.authenticateUser();

            this.isInitialized = true;
            console.log('Firebase service initialized successfully');
            return true;
        } catch (error) {
            console.error('Firebase initialization error:', error);
            this.useLocalStorageFallback = true;
            return false;
        }
    }

    /**
     * Authenticate user (anonymous auth for simplicity)
     * Users can optionally implement email/password auth later
     */
    async authenticateUser() {
        return new Promise((resolve, reject) => {
            // Check if user is already signed in
            this.auth.onAuthStateChanged(async (user) => {
                if (user) {
                    this.userId = user.uid;
                    this.userDataRef = this.db.ref(`users/${this.userId}/plannerData`);
                    console.log('User authenticated:', this.userId);
                    resolve(user);
                } else {
                    // Sign in anonymously
                    try {
                        const userCredential = await this.auth.signInAnonymously();
                        this.userId = userCredential.user.uid;
                        this.userDataRef = this.db.ref(`users/${this.userId}/plannerData`);
                        console.log('User signed in anonymously:', this.userId);
                        resolve(userCredential.user);
                    } catch (error) {
                        console.error('Authentication error:', error);
                        reject(error);
                    }
                }
            });
        });
    }

    /**
     * Save all planner data to Firebase
     * @param {Object} data - Complete planner data object
     * @returns {Promise<boolean>} Success status
     */
    async saveData(data) {
        if (this.useLocalStorageFallback || !this.isInitialized) {
            // Fallback to localStorage
            localStorage.setItem('abishuasPlannerData', JSON.stringify(data));
            return true;
        }

        try {
            await this.userDataRef.set({
                workTasks: data.workTasks || [],
                personalTasks: data.personalTasks || [],
                dailyTasks: data.dailyTasks || [],
                scheduleItems: data.scheduleItems || [],
                weeklyRoutines: data.weeklyRoutines || {},
                goals: data.goals || [],
                notes: data.notes || [],
                lastUpdated: firebase.database.ServerValue.TIMESTAMP
            });
            return true;
        } catch (error) {
            console.error('Error saving data to Firebase:', error);
            // Fallback to localStorage on error
            localStorage.setItem('abishuasPlannerData', JSON.stringify(data));
            return false;
        }
    }

    /**
     * Load all planner data from Firebase
     * @returns {Promise<Object|null>} Planner data or null
     */
    async loadData() {
        if (this.useLocalStorageFallback || !this.isInitialized) {
            // Fallback to localStorage
            try {
                const saved = localStorage.getItem('abishuasPlannerData');
                return saved ? JSON.parse(saved) : null;
            } catch (error) {
                console.error('Error loading from localStorage:', error);
                return null;
            }
        }

        try {
            const snapshot = await this.userDataRef.once('value');
            const data = snapshot.val();

            if (data) {
                // Remove Firebase metadata
                delete data.lastUpdated;
                return data;
            }

            return null;
        } catch (error) {
            console.error('Error loading data from Firebase:', error);
            // Try localStorage as fallback
            try {
                const saved = localStorage.getItem('abishuasPlannerData');
                return saved ? JSON.parse(saved) : null;
            } catch (e) {
                return null;
            }
        }
    }

    /**
     * Set up real-time listener for data changes
     * @param {Function} callback - Function to call when data changes
     */
    onDataChange(callback) {
        if (this.useLocalStorageFallback || !this.isInitialized) {
            console.log('Real-time sync not available in localStorage mode');
            return;
        }

        this.onDataChangeCallback = callback;

        this.userDataRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data && callback) {
                delete data.lastUpdated;
                callback(data);
            }
        }, (error) => {
            console.error('Error in real-time listener:', error);
        });
    }

    /**
     * Remove real-time listener
     */
    offDataChange() {
        if (this.userDataRef) {
            this.userDataRef.off('value');
        }
    }

    /**
     * Save theme preference
     * @param {boolean} isDarkMode - Dark mode enabled
     */
    async saveTheme(isDarkMode) {
        if (this.useLocalStorageFallback || !this.isInitialized) {
            localStorage.setItem('darkMode', isDarkMode);
            return;
        }

        try {
            await this.db.ref(`users/${this.userId}/preferences/darkMode`).set(isDarkMode);
        } catch (error) {
            console.error('Error saving theme:', error);
            localStorage.setItem('darkMode', isDarkMode);
        }
    }

    /**
     * Load theme preference
     * @returns {Promise<boolean>} Dark mode preference
     */
    async loadTheme() {
        if (this.useLocalStorageFallback || !this.isInitialized) {
            return localStorage.getItem('darkMode') === 'true';
        }

        try {
            const snapshot = await this.db.ref(`users/${this.userId}/preferences/darkMode`).once('value');
            const darkMode = snapshot.val();
            return darkMode === true;
        } catch (error) {
            console.error('Error loading theme:', error);
            return localStorage.getItem('darkMode') === 'true';
        }
    }

    /**
     * Migrate data from localStorage to Firebase
     * @returns {Promise<boolean>} Success status
     */
    async migrateFromLocalStorage() {
        if (this.useLocalStorageFallback || !this.isInitialized) {
            console.log('Cannot migrate: Firebase not available');
            return false;
        }

        try {
            // Check if Firebase already has data
            const snapshot = await this.userDataRef.once('value');
            if (snapshot.exists()) {
                console.log('Firebase already has data, skipping migration');
                return false;
            }

            // Load from localStorage
            const saved = localStorage.getItem('abishuasPlannerData');
            if (!saved) {
                console.log('No localStorage data to migrate');
                return false;
            }

            const data = JSON.parse(saved);
            console.log('Migrating data from localStorage to Firebase...');

            await this.saveData(data);

            // Also migrate theme
            const darkMode = localStorage.getItem('darkMode') === 'true';
            await this.saveTheme(darkMode);

            console.log('Migration completed successfully!');
            return true;
        } catch (error) {
            console.error('Error during migration:', error);
            return false;
        }
    }

    /**
     * Clear all user data (useful for testing)
     * @returns {Promise<boolean>} Success status
     */
    async clearAllData() {
        if (this.useLocalStorageFallback || !this.isInitialized) {
            localStorage.removeItem('abishuasPlannerData');
            return true;
        }

        try {
            await this.userDataRef.remove();
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    /**
     * Sign out current user
     */
    async signOut() {
        if (this.auth) {
            try {
                await this.auth.signOut();
                this.userId = null;
                this.userDataRef = null;
                this.isInitialized = false;
            } catch (error) {
                console.error('Error signing out:', error);
            }
        }
    }

    /**
     * Get current user ID
     * @returns {string|null} User ID
     */
    getUserId() {
        return this.userId;
    }

    /**
     * Check if Firebase is properly initialized
     * @returns {boolean} Initialization status
     */
    isReady() {
        return this.isInitialized && !this.useLocalStorageFallback;
    }
}

// Create global instance
window.firebaseService = new FirebaseService();
