import Notification from '../models/Notification.js';
import { emitNotification } from './socket.service.js';

/**
 * Create and send a notification
 * @param {String} userId - User ID to send notification to
 * @param {String} type - Notification type
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {String} relatedDonationId - Related donation ID (optional)
 */
export const createNotification = async (userId, type, title, message, relatedDonationId = null) => {
    try {
        const notification = await Notification.create({
            userId,
            type,
            title,
            message,
            relatedDonationId,
        });

        // Emit real-time notification via Socket.io
        emitNotification(userId.toString(), notification);

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

/**
 * Create notifications for multiple users
 */
export const createBulkNotifications = async (notifications) => {
    try {
        const createdNotifications = await Notification.insertMany(notifications);

        // Emit to all users
        createdNotifications.forEach(notification => {
            emitNotification(notification.userId.toString(), notification);
        });

        return createdNotifications;
    } catch (error) {
        console.error('Error creating bulk notifications:', error);
        throw error;
    }
};
