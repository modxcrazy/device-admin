// Check auth state
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = 'login.html';
    }
});

// Logout function
document.getElementById('logoutBtn').addEventListener('click', () => {
    auth.signOut().then(() => {
        window.location.href = 'login.html';
    });
});
