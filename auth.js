// Authentication Page Handler
class AuthPage {
    constructor() {
        this.auth = firebase.auth();
        this.db = firebase.database();
        this.currentMode = 'login';

        this.init();
    }

    init() {
        // Check if user is already signed in
        this.auth.onAuthStateChanged((user) => {
            if (user) {
                // User is signed in, redirect to main app
                this.redirectToApp();
            }
        });

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Toggle between login and signup
        document.getElementById('loginToggle')?.addEventListener('click', () => this.switchMode('login'));
        document.getElementById('signupToggle')?.addEventListener('click', () => this.switchMode('signup'));

        // Google Sign-In buttons
        document.getElementById('googleSignInLogin')?.addEventListener('click', () => this.signInWithGoogle());
        document.getElementById('googleSignInSignup')?.addEventListener('click', () => this.signInWithGoogle());

        // Email/Password forms
        document.getElementById('emailLoginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.signInWithEmail();
        });

        document.getElementById('emailSignupForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.signUpWithEmail();
        });

        // Password toggles
        this.setupPasswordToggle('loginPasswordToggle', 'loginPassword');
        this.setupPasswordToggle('signupPasswordToggle', 'signupPassword');
        this.setupPasswordToggle('confirmPasswordToggle', 'signupConfirmPassword');

        // Password strength indicator
        document.getElementById('signupPassword')?.addEventListener('input', (e) => {
            this.updatePasswordStrength(e.target.value);
        });

        // Forgot password
        document.querySelector('.forgot-password')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleForgotPassword();
        });
    }

    switchMode(mode) {
        this.currentMode = mode;

        // Update toggle buttons
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Update form containers
        document.getElementById('loginForm').classList.toggle('active', mode === 'login');
        document.getElementById('signupForm').classList.toggle('active', mode === 'signup');

        // Toggle body class for color inversion
        document.body.classList.toggle('signup-mode', mode === 'signup');
    }

    setupPasswordToggle(buttonId, inputId) {
        const button = document.getElementById(buttonId);
        const input = document.getElementById(inputId);

        if (!button || !input) return;

        button.addEventListener('click', () => {
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;

            const icon = button.querySelector('i');
            icon.classList.toggle('fa-eye', type === 'password');
            icon.classList.toggle('fa-eye-slash', type === 'text');
        });
    }

    updatePasswordStrength(password) {
        const strengthFill = document.getElementById('strengthFill');
        const strengthText = document.getElementById('strengthText');

        if (!strengthFill || !strengthText) return;

        let strength = 'weak';
        let strengthValue = 0;

        if (password.length === 0) {
            strengthFill.className = 'strength-fill';
            strengthText.className = 'strength-text';
            strengthText.textContent = '';
            return;
        }

        // Calculate password strength
        if (password.length >= 8) strengthValue++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strengthValue++;
        if (/\d/.test(password)) strengthValue++;
        if (/[^a-zA-Z0-9]/.test(password)) strengthValue++;

        if (strengthValue <= 1) {
            strength = 'weak';
        } else if (strengthValue <= 3) {
            strength = 'medium';
        } else {
            strength = 'strong';
        }

        strengthFill.className = `strength-fill ${strength}`;
        strengthText.className = `strength-text ${strength}`;
        strengthText.textContent = `Password strength: ${strength}`;
    }

    async signInWithGoogle() {
        this.showLoading('Signing in with Google...');

        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            // Force account selection
            provider.setCustomParameters({
                prompt: 'select_account'
            });

            // Use popup for sign-in
            const result = await this.auth.signInWithPopup(provider);
            const user = result.user;

            // Update user profile if needed
            await this.updateUserProfile(user);

            this.showNotification('Successfully signed in with Google!', 'success');
            this.redirectToApp();
        } catch (error) {
            console.error('Google sign-in error:', error);
            this.handleAuthError(error);
        } finally {
            this.hideLoading();
        }
    }

    async signInWithEmail() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showNotification('Please enter email and password', 'warning');
            return;
        }

        this.showLoading('Signing you in...');

        try {
            await this.auth.signInWithEmailAndPassword(email, password);
            this.showNotification('Successfully signed in!', 'success');
            this.redirectToApp();
        } catch (error) {
            console.error('Email sign-in error:', error);
            this.handleAuthError(error);
        } finally {
            this.hideLoading();
        }
    }

    async signUpWithEmail() {
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            this.showNotification('Please fill in all fields', 'warning');
            return;
        }

        if (password !== confirmPassword) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }

        if (password.length < 8) {
            this.showNotification('Password must be at least 8 characters', 'warning');
            return;
        }

        if (!agreeTerms) {
            this.showNotification('Please agree to the Terms & Conditions', 'warning');
            return;
        }

        this.showLoading('Creating your account...');

        try {
            const result = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = result.user;

            // Update user profile with name
            await user.updateProfile({
                displayName: name
            });

            // Initialize user data in database
            await this.updateUserProfile(user);

            this.showNotification('Account created successfully!', 'success');
            this.redirectToApp();
        } catch (error) {
            console.error('Sign-up error:', error);
            this.handleAuthError(error);
        } finally {
            this.hideLoading();
        }
    }

    async updateUserProfile(user) {
        try {
            // Create user profile in database
            const userRef = this.db.ref(`users/${user.uid}/profile`);
            const snapshot = await userRef.once('value');

            if (!snapshot.exists()) {
                await userRef.set({
                    displayName: user.displayName || 'User',
                    email: user.email,
                    photoURL: user.photoURL || null,
                    createdAt: firebase.database.ServerValue.TIMESTAMP,
                    lastLogin: firebase.database.ServerValue.TIMESTAMP
                });
            } else {
                // Update last login
                await userRef.update({
                    lastLogin: firebase.database.ServerValue.TIMESTAMP
                });
            }
        } catch (error) {
            console.error('Error updating user profile:', error);
        }
    }

    async handleForgotPassword() {
        const email = document.getElementById('loginEmail').value.trim();

        if (!email) {
            this.showNotification('Please enter your email address first', 'warning');
            document.getElementById('loginEmail').focus();
            return;
        }

        this.showLoading('Sending password reset email...');

        try {
            await this.auth.sendPasswordResetEmail(email);
            this.showNotification('Password reset email sent! Check your inbox.', 'success');
        } catch (error) {
            console.error('Password reset error:', error);
            this.handleAuthError(error);
        } finally {
            this.hideLoading();
        }
    }

    handleAuthError(error) {
        let message = 'An error occurred. Please try again.';

        switch (error.code) {
            case 'auth/email-already-in-use':
                message = 'This email is already registered. Please sign in instead.';
                break;
            case 'auth/invalid-email':
                message = 'Please enter a valid email address.';
                break;
            case 'auth/user-not-found':
                message = 'No account found with this email. Please sign up.';
                break;
            case 'auth/wrong-password':
                message = 'Incorrect password. Please try again.';
                break;
            case 'auth/weak-password':
                message = 'Password is too weak. Please use a stronger password.';
                break;
            case 'auth/too-many-requests':
                message = 'Too many attempts. Please try again later.';
                break;
            case 'auth/popup-closed-by-user':
                message = 'Sign-in cancelled. Please try again.';
                break;
            case 'auth/network-request-failed':
                message = 'Network error. Please check your connection.';
                break;
            default:
                message = error.message || 'An error occurred. Please try again.';
        }

        this.showNotification(message, 'error');
    }

    showLoading(text = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        const loadingText = overlay.querySelector('.loading-text');

        if (loadingText) loadingText.textContent = text;
        overlay.classList.add('active');
    }

    hideLoading() {
        document.getElementById('loadingOverlay')?.classList.remove('active');
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        if (!notification) return;

        const icon = notification.querySelector('i');
        const messageEl = notification.querySelector('.notification-message');

        // Update icon based on type
        icon.className = type === 'success' ? 'fas fa-check-circle' :
                        type === 'error' ? 'fas fa-exclamation-circle' :
                        'fas fa-exclamation-triangle';

        // Update message
        messageEl.textContent = message;

        // Update notification class
        notification.className = `notification ${type}`;

        // Show notification
        notification.classList.add('show');

        // Hide after 4 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    }

    redirectToApp() {
        // Add a small delay for better UX
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    }
}

// Initialize auth page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthPage();
});
