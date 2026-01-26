import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
    try {
        // Check if already initialized
        if (admin.apps.length === 0) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                }),
                storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
            });
            console.log('Firebase Admin SDK initialized');
            console.log('Storage Bucket:', process.env.VITE_FIREBASE_STORAGE_BUCKET);
        }
    } catch (error) {
        console.error('Firebase initialization error:', error);
        throw error;
    }
};

export { admin, initializeFirebase };
