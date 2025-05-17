import { auth } from './dashboard.js';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const resetPasswordLink = document.getElementById('resetPassword');
const loginBtn = document.getElementById('loginBtn');

// Error messages
const ERROR_MESSAGES = {
    'auth/invalid-email': 'Invalid email address',
    'auth/user-disabled': 'Account disabled',
    'auth/user-not-found': 'Account not found',
    'auth/wrong-password': 'Incorrect password',
    'auth/too-many-requests': 'Too many attempts. Account temporarily locked',
    'auth/network-request-failed': 'Network error. Please check your connection'
};

// Initialize auth module
export function initAuth() {
    // Check if on login page
    if (loginForm) {
        setupLoginForm();
    }

    // Check if user is already logged in
    monitorAuthState();
}

function setupLoginForm() {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleLogin();
    });

    if (resetPasswordLink) {
        resetPasswordLink.addEventListener('click', handlePasswordReset);
    }
}

function monitorAuthState() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // User is logged in
            if (isLoginPage()) {
                // Verify admin role before redirecting
                try {
                    const token = await user.getIdTokenResult();
                    if (token.claims.admin) {
                        window.location.href = 'index.html';
                    } else {
                        await auth.signOut();
                        showError("You don't have admin privileges");
                    }
                } catch (error) {
                    console.error("Token verification error:", error);
                    await auth.signOut();
                }
            }
        } else {
            // User is logged out
            if (!isLoginPage() && !isPublicPage()) {
                window.location.href = 'login.html';
            }
        }
    });
}

async function handleLogin() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showError("Please enter both email and password");
        return;
    }

    try {
        // Show loading state
        setLoadingState(true);

        // Sign in with email/password
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        
        // Verify admin role
        const token = await userCredential.user.getIdTokenResult();
        if (!token.claims.admin) {
            await auth.signOut();
            showError("You don't have admin privileges");
            return;
        }

        // Redirect to dashboard
        window.location.href = 'index.html';

    } catch (error) {
        console.error("Login error:", error);
        showError(getErrorMessage(error));
    } finally {
        setLoadingState(false);
    }
}

async function handlePasswordReset(e) {
    e.preventDefault();

    const email = prompt('Please enter your email address:');
    if (!email) return;

    try {
        setLoadingState(true, resetPasswordLink);
        await auth.sendPasswordResetEmail(email);
        alert('Password reset email sent. Please check your inbox.');
    } catch (error) {
        console.error("Password reset error:", error);
        alert(getErrorMessage(error));
    } finally {
        setLoadingState(false, resetPasswordLink);
    }
}

function getErrorMessage(error) {
    return ERROR_MESSAGES[error.code] || error.message || "An unknown error occurred";
}

function showError(message) {
    // Remove any existing error alerts
    const existingAlert = document.querySelector('.alert-danger');
    if (existingAlert) {
        existingAlert.remove();
    }

    // Create and display new error alert
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger mt-3';
    alertDiv.innerHTML = `
        <i class="bi bi-exclamation-triangle-fill"></i>
        ${message}
    `;
    
    if (loginForm) {
        loginForm.appendChild(alertDiv);
    } else {
        document.body.prepend(alertDiv);
    }

    // Auto-remove after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function setLoadingState(isLoading, element = loginBtn) {
    if (!element) return;

    if (isLoading) {
        element.disabled = true;
        if (element.tagName === 'BUTTON') {
            const originalText = element.innerHTML;
            element.setAttribute('data-original-text', originalText);
            element.innerHTML = `
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Processing...
            `;
        }
    } else {
        element.disabled = false;
        if (element.tagName === 'BUTTON') {
            const originalText = element.getAttribute('data-original-text');
            if (originalText) {
                element.innerHTML = originalText;
            }
        }
    }
}

function isLoginPage() {
    return window.location.pathname.endsWith('login.html');
}

function isPublicPage() {
    // Add any public pages that don't require auth
    return false;
}

// Initialize auth module when DOM is loaded
document.addEventListener('DOMContentLoaded', initAuth);
