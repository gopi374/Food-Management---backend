import express from 'express';
import { body } from 'express-validator';
import { register, getProfile, updateProfile, uploadAvatar } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

// Register
router.post(
    '/register',
    [
        body('firebaseUid').notEmpty().withMessage('Firebase UID is required'),
        body('userType').isIn(['donor', 'recipient']).withMessage('Invalid user type'),
        body('name').notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('phone').notEmpty().withMessage('Phone is required'),
        body('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('Valid coordinates required'),
        body('address').notEmpty().withMessage('Address is required'),
        validate,
    ],
    register
);

// Get profile (protected)
router.get('/profile', authenticate, getProfile);

// Update profile (protected)
router.put('/profile', authenticate, updateProfile);

// Upload avatar (protected)
router.post('/upload-avatar', authenticate, upload.single('avatar'), uploadAvatar);

export default router;
