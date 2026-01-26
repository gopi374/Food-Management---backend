import express from 'express';
import User from '../models/User.js';
import { authenticate, requireRecipient } from '../middleware/auth.middleware.js';
import { AppError } from '../middleware/error.middleware.js';

const router = express.Router();

// Toggle recipient availability
router.put('/availability', authenticate, requireRecipient, async (req, res, next) => {
    try {
        const { isAvailable, capacity } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) throw new AppError('User not found', 404);

        if (typeof isAvailable !== 'undefined') user.isAvailable = isAvailable;
        if (typeof capacity !== 'undefined') user.capacity = capacity;

        await user.save();

        res.json({
            success: true,
            message: 'Availability updated',
            user: {
                isAvailable: user.isAvailable,
                capacity: user.capacity
            }
        });
    } catch (error) {
        next(error);
    }
});

// Get user by ID
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-firebaseUid -email'); // Protect sensitive info

        if (!user) throw new AppError('User not found', 404);

        res.json({
            success: true,
            user
        });
    } catch (error) {
        next(error);
    }
});

export default router;
