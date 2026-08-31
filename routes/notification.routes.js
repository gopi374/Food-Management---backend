import express from 'express';
import Notification from '../models/Notification.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

// Get all notifications for current user
router.get('/', async (req, res, next) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id })
            .populate({
                path: 'relatedDonationId',
                populate: {
                    path: 'donor recipient',
                    select: 'name organization phone address location'
                }
            })
            .sort('-createdAt')
            .limit(50);

        const unreadCount = await Notification.countDocuments({
            userId: req.user._id,
            isRead: false
        });

        res.json({
            success: true,
            unreadCount,
            notifications
        });
    } catch (error) {
        next(error);
    }
});

// Mark notification as read
router.patch('/:id/read', async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { isRead: true },
            { new: true }
        );

        res.json({
            success: true,
            notification
        });
    } catch (error) {
        next(error);
    }
});

// Mark all as read
router.put('/read-all', async (req, res, next) => {
    try {
        await Notification.updateMany(
            { userId: req.user._id, isRead: false },
            { isRead: true }
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        next(error);
    }
});

// Delete notification
router.delete('/:id', async (req, res, next) => {
    try {
        await Notification.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

        res.json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        next(error);
    }
});

export default router;
