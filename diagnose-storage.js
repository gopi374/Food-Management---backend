import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

try {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
    });
} catch (e) { }

async function diagnose() {
    try {
        console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);
        const storage = admin.storage();

        // Try the bucket in .env first
        const envBucketName = process.env.VITE_FIREBASE_STORAGE_BUCKET;
        console.log('Testing .env bucket:', envBucketName);

        try {
            const bucket = storage.bucket(envBucketName);
            await bucket.getMetadata();
            console.log('✅ .env bucket is valid!');
        } catch (e) {
            console.log('❌ .env bucket failed:', e.message);
        }

        const appspotName = `${process.env.FIREBASE_PROJECT_ID}.appspot.com`;
        console.log('Testing appspot bucket:', appspotName);
        try {
            const bucket = storage.bucket(appspotName);
            await bucket.getMetadata();
            console.log('✅ appspot bucket is valid!');
        } catch (e) {
            console.log('❌ appspot bucket failed:', e.message);
        }

        // Discovery
        console.log('\nScanning for project buckets...');
        const storageInstance = storage.bucket().storage;
        const [buckets] = await storageInstance.getBuckets();

        if (buckets.length === 0) {
            console.log('❌ NO BUCKETS FOUND.');
            console.log('ACTION REQUIRED: Go to Firebase Console > Storage and click "Get Started".');
        } else {
            console.log('✅ Found buckets:', buckets.map(b => b.name));
        }
        process.exit(0);
    } catch (err) {
        console.error('Diagnostic error:', err);
        process.exit(1);
    }
}

diagnose();
