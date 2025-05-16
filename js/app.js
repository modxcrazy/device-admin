// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB306yl-qAYoSYVHP3LAby-aNiftH9OkpI",
    authDomain: "devicead-992ca.firebaseapp.com",
    projectId: "devicead-992ca",
    storageBucket: "devicead-992ca.firebasestorage.app",
    messagingSenderId: "160209495227",
    appId: "1:160209495227:web:1d68b034fedddffd43759e",
    measurementId: "G-CSCNLM5PL2"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const functions = firebase.functions();
