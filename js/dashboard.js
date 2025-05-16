// Initialize Firebase
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const functions = firebase.functions();

// DOM Elements
const logoutLink = document.getElementById('logoutLink');
const userName = document.getElementById('userName');
const totalDevices = document.getElementById('totalDevices');
const activeDevices = document.getElementById('activeDevices');
const pendingCommands = document.getElementById('pendingCommands');
const securityAlerts = document.getElementById('securityAlerts');
const refreshBtn = document.getElementById('refreshBtn');

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Check auth state
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'login.html';
        } else {
            // Load user data
            loadUserData(user);
            
            // Load dashboard stats
            loadDashboardStats();
            
            // Load devices
            loadDevices();
            
            // Set up event listeners
            setupEventListeners();
        }
    });
});

function loadUserData(user) {
    // Display user name
    userName.textContent = user.displayName || user.email.split('@')[0];
    
    // Load user profile data from Firestore
    db.collection('users').doc(user.uid).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                // Update UI with additional user data if needed
            }
        })
        .catch(error => {
            console.error("Error loading user data:", error);
        });
}

function loadDashboardStats() {
    // Load device count
    db.collection('devices').get()
        .then(snapshot => {
            totalDevices.textContent = snapshot.size;
            
            // Count active devices (last active within 24 hours)
            const activeCount = Array.from(snapshot.docs).filter(doc => {
                const lastActive = doc.data().lastActive?.toDate();
                return lastActive && (new Date() - lastActive) < 86400000; // 24 hours
            }).length;
            
            activeDevices.textContent = activeCount;
        });
    
    // Load pending commands count
    db.collection('commands')
        .where('status', '==', 'pending')
        .get()
        .then(snapshot => {
            pendingCommands.textContent = snapshot.size;
        });
    
    // Load security alerts count
    db.collection('alerts')
        .where('resolved', '==', false)
        .get()
        .then(snapshot => {
            securityAlerts.textContent = snapshot.size;
        });
}

function setupEventListeners() {
    // Logout
    logoutLink.addEventListener('click', e => {
        e.preventDefault();
        auth.signOut()
            .then(() => {
                window.location.href = 'login.html';
            })
            .catch(error => {
                console.error("Logout error:", error);
                alert("Logout failed. Please try again.");
            });
    });
    
    // Refresh button
    refreshBtn.addEventListener('click', () => {
        loadDashboardStats();
        loadDevices();
    });
    
    // Command type dropdown
    const commandType = document.getElementById('commandType');
    if (commandType) {
        commandType.addEventListener('change', e => {
            document.getElementById('passwordField').style.display = 
                e.target.value === 'reset_password' ? 'block' : 'none';
            document.getElementById('customCommandField').style.display = 
                e.target.value === 'custom_command' ? 'block' : 'none';
        });
    }
    
    // Command target dropdown
    const commandTarget = document.getElementById('commandTarget');
    if (commandTarget) {
        commandTarget.addEventListener('change', e => {
            document.getElementById('deviceGroupField').style.display = 
                e.target.value === 'group' ? 'block' : 'none';
        });
    }
}

// Export for other modules
export { auth, db, functions };
