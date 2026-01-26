import { admin } from '../config/firebase.js';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split('Bearer ')[1];

        // Verify Firebase token
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Get user from database
        const user = await User.findOne({ firebaseUid: decodedToken.uid });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Attach user to request
        req.user = user;
        req.firebaseUid = decodedToken.uid;

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

export const requireDonor = (req, res, next) => {
    if (req.user.userType !== 'donor') {
        return res.status(403).json({ message: 'Access denied. Donor role required.' });
    }
    next();
};

export const requireRecipient = (req, res, next) => {
    if (req.user.userType !== 'recipient') {
        return res.status(403).json({ message: 'Access denied. Recipient role required.' });
    }
    next();
};
