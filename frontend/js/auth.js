// 1. Firebase Configuration (INTEGRATED)
const firebaseConfig = {
  apiKey: "AIzaSyDRwbbc43jJpPQ2PPliyVaVDkq2qjj_k6Q",
  authDomain: "mongodblms.firebaseapp.com",
  projectId: "mongodblms",
  storageBucket: "mongodblms.firebasestorage.app",
  messagingSenderId: "821298895523",
  appId: "1:821298895523:web:1d373861a5fafe4245fd16",
  measurementId: "G-RR1LGVC3Y9"
};

// 2. Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

const AUTH = {
    check() {
        const user = localStorage.getItem('mongo_academy_user');
        if (!user && !window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
        if (user && window.location.pathname.includes('login.html')) {
            window.location.href = 'dashboard.html';
        }
        return user ? JSON.parse(user) : null;
    },

    // 3. Signup/Login via Firebase (Email/Pass)
    async login(username, email) {
        try {
            // For simple masterclass entry, we'll use a fixed internal credential
            // or just bypass to sync if it's a demo. 
            // In real production, you'd use auth.signInWithEmailAndPassword
            await this.syncWithBackend(username, email);
        } catch (err) {
            console.error(err);
            alert('Auth failed: ' + err.message);
        }
    },

    // 4. Google Login via Firebase
    async googleLogin() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await auth.signInWithPopup(provider);
            const user = result.user;

            await this.syncWithBackend(user.displayName, user.email);
        } catch (err) {
            console.error(err);
            alert('Google Login failed. Check your Firebase console settings.');
        }
    },

    // 5. Sync Firebase user with MySQL Backend
    async syncWithBackend(username, email) {
        try {
            const response = await fetch('http://localhost:8084/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    username: username
                })
            });
            const dbUser = await response.json();
            localStorage.setItem('mongo_academy_user', JSON.stringify(dbUser));
            window.location.href = 'dashboard.html';
        } catch (err) {
            alert('Firebase Auth succeeded, but could not sync with MySQL Backend.');
        }
    },

    logout() {
        auth.signOut();
        localStorage.removeItem('mongo_academy_user');
        window.location.href = 'login.html';
    }
};
