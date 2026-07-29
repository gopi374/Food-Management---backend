import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
});

async function diagnose() {
  try {
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET;

    if (!bucketName) {
      throw new Error('No Firebase storage bucket name configured in .env.');
    }

    console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);
    console.log('Testing bucket name:', bucketName);

    const bucket = admin.storage().bucket(bucketName);
    const [exists] = await bucket.exists();

    if (!exists) {
      console.log('❌ bucket failed: Bucket does not exist.');
      console.log('ACTION REQUIRED: Enable Firebase Storage in the Firebase Console and create the bucket.');
      process.exit(1);
    }

    await bucket.getMetadata();
    console.log('✅ bucket is valid!');
    process.exit(0);
  } catch (err) {
    console.error('Diagnostic error:', err);
    process.exit(1);
  }
}

diagnose();
