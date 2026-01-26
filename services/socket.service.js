import { getIO } from '../config/socket.js';

/**
 * Emit notification to a specific user
 */
export const emitNotification = (userId, notification) => {
    try {
        const io = getIO();
        io.to(userId).emit('notification', notification);
    } catch (error) {
        console.error('Error emitting notification:', error);
    }
};

/**
 * Emit donation update to a specific user
 */
export const emitDonationUpdate = (userId, donation) => {
    try {
        const io = getIO();
        io.to(userId).emit('donation_update', donation);
    } catch (error) {
        console.error('Error emitting donation update:', error);
    }
};

/**
 * Emit new donation to multiple recipients
 */
export const emitNewDonationToRecipients = (recipientIds, donation) => {
    try {
        const io = getIO();
        recipientIds.forEach(recipientId => {
            io.to(recipientId.toString()).emit('new_donation', donation);
        });
    } catch (error) {
        console.error('Error emitting new donation:', error);
    }
};
