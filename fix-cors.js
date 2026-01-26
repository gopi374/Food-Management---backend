import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from current directory
dotenv.config({ path: path.join(__dirname, '.env') });

const initializeFirebase = () => {
    try {
        if (admin.apps.length === 0) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                }),
                storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'food-management-699f2.firebasestorage.app'
            });
            console.log('Firebase Admin SDK initialized');
        }
    } catch (error) {
        console.error('Firebase initialization error:', error);
        process.exit(1);
    }
};

initializeFirebase();

const bucket = admin.storage().bucket();

const corsConfiguration = [
    {
        origin: ['http://localhost:5173'],
        method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
        responseHeader: ['Content-Type', 'Authorization', 'x-goog-resumable'],
        maxAgeSeconds: 3600
    }
];

async function listBuckets() {
    try {
        // The Admin SDK storage() object doesn't have listBuckets, 
        // we need to use the @google-cloud/storage part which is hidden in bucket().storage
        const storageInstance = admin.storage().bucket().storage;
        console.log('Fetching buckets for project:', process.env.FIREBASE_PROJECT_ID);
        const [buckets] = await storageInstance.getBuckets();

        if (buckets.length === 0) {
            console.log('❌ NO BUCKETS FOUND. User must go to Firebase Console > Storage and click "Get Started".');
        } else {
            console.log('✅ Found buckets:', buckets.map(b => b.name));
            console.log('Recommended bucket:', buckets[0].name);
        }
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

listBuckets();

setCors();
