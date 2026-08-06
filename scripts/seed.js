import mongoose from 'mongoose';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Donation from '../models/Donation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

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

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const seedDatabase = async () => {
    try {
        await connectDB();
        initializeFirebase();

        console.log('Clearing old test data...');
        const testEmails = ['donor@test.com', 'recipient@test.com'];
        
        // Remove from Firebase
        for (const email of testEmails) {
            try {
                const userRecord = await admin.auth().getUserByEmail(email);
                await admin.auth().deleteUser(userRecord.uid);
                console.log(`Deleted Firebase user: ${email}`);
            } catch (err) {
                if (err.code !== 'auth/user-not-found') {
                    console.error('Error deleting firebase user:', err);
                }
            }
        }

        // Remove from MongoDB
        // const deletedUsers = await User.deleteMany({ email: { $in: testEmails } });
        // console.log(`Deleted ${deletedUsers.deletedCount} users from MongoDB`);

        // Create Donor
        console.log('Creating Test Donor...');
        const donorAuth = await admin.auth().createUser({
            email: 'donor@test.com',
            password: 'password123',
            displayName: 'Test Donor'
        });

        const donorUser = await User.create({
            firebaseUid: donorAuth.uid,
            userType: 'donor',
            name: 'Test Donor',
            email: 'donor@test.com',
            phone: '1234567890',
            address: '123 Donor St, City',
            location: {
                type: 'Point',
                coordinates: [-122.4194, 37.7749] // SF
            }
        });

        // Create Recipient
        console.log('Creating Test Recipient...');
        const recipientAuth = await admin.auth().createUser({
            email: 'recipient@test.com',
            password: 'password123',
            displayName: 'Test NGO'
        });

        const recipientUser = await User.create({
            firebaseUid: recipientAuth.uid,
            userType: 'recipient',
            name: 'Test NGO Manager',
            email: 'recipient@test.com',
            phone: '0987654321',
            organization: 'Test NGO',
            address: '456 Recipient Ave, City',
            location: {
                type: 'Point',
                coordinates: [-122.4194, 37.8] // Nearby
            }
        });

        // Clear existing test donations just in case
        await Donation.deleteMany({ donor: donorUser._id });

        console.log('Creating Test Donations...');
        await Donation.create([
            {
                donor: donorUser._id,
                foodType: 'Fresh Apples',
                category: 'fruits_vegetables',
                quantity: { value: 10, unit: 'kg' },
                description: 'A box of fresh apples from our farm.',
                preparationTime: new Date(),
                expiryTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
                location: donorUser.location,
                address: donorUser.address,
                contactPhone: donorUser.phone,
                status: 'pending'
            },
            {
                donor: donorUser._id,
                foodType: 'Baked Bread',
                category: 'baked_goods',
                quantity: { value: 20, unit: 'pieces' },
                description: 'Leftover fresh bread from the bakery.',
                preparationTime: new Date(),
                expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
                location: donorUser.location,
                address: donorUser.address,
                contactPhone: donorUser.phone,
                status: 'pending'
            }
        ]);

        console.log('✅ Seeding completed successfully!');
        console.log('----------------------------------------------------');
        console.log('Donor Login:    donor@test.com / password123');
        console.log('Recipient Login: recipient@test.com / password123');
        console.log('----------------------------------------------------');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedDatabase();
