import Donation from '../models/Donation.js';
import User from '../models/User.js';
import { autoMatchDonation, calculateDistance } from '../services/geospatial.service.js';
import { createNotification } from '../services/notification.service.js';
import { emitNewDonationToRecipients, emitDonationUpdate } from '../services/socket.service.js';
import { AppError } from '../middleware/error.middleware.js';

/**
 * @desc    Create new donation
 * @route   POST /api/donations
 * @access  Private (Donor)
 */
export const createDonation = async (req, res, next) => {
    try {
        const {
            foodType,
            category,
            quantity,
            description,
            preparationTime,
            expiryTime,
            location,
            address,
            contactPhone,
            imageUrl
        } = req.body;

        const donation = await Donation.create({
            donor: req.user._id,
            foodType,
            category,
            quantity,
            description,
            preparationTime,
            expiryTime,
            location: {
                type: 'Point',
                coordinates: location.coordinates,
            },
            address,
            contactPhone,
            imageUrl,
        });

        // Auto-match with nearby recipients
        const matchedRecipients = await autoMatchDonation(donation);
        donation.matchedRecipients = matchedRecipients;
        await donation.save();

        // Notify matched recipients
        const recipientIds = matchedRecipients.map(m => m.recipient);

        // Create notifications for each recipient
        for (const recipientId of recipientIds) {
            await createNotification(
                recipientId,
                'new_donation',
                'New Food Donation Nearby',
                `A new donation of ${foodType} is available near you.`,
                donation._id
            );
        }

        // Emit real-time socket events
        emitNewDonationToRecipients(recipientIds, donation);

        res.status(201).json({
            success: true,
            donation
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all donations with filters
 * @route   GET /api/donations
 * @access  Private
 */
export const getDonations = async (req, res, next) => {
    try {
        const { status, category, lat, lng, radius = 10 } = req.query;
        const query = {};

        if (status) {
            query.status = status;
            // If status is accepted or completed, ensure we only return what belongs to the user
            if ((status === 'accepted' || status === 'completed') && req.user.userType === 'recipient') {
                query.recipient = req.user._id;
            }
        } else {
            // Default to only pending donations for the discovery feed
            query.status = 'pending';
        }

        if (category) query.category = category;

        // Spatial filter if coordinates provided
        if (lat && lng) {
            query.location = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)],
                    },
                    $maxDistance: radius * 1000, // Convert km to meters
                },
            };
        }

        const donations = await Donation.find(query)
            .populate('donor', 'name organization profilePicture')
            .populate('recipient', 'name organization profilePicture')
            .sort('-createdAt');

        res.json({
            success: true,
            count: donations.length,
            donations
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get current user's donations
 * @route   GET /api/donations/my-donations
 * @access  Private
 */
export const getMyDonations = async (req, res, next) => {
    try {
        const query = {
            $or: [
                { donor: req.user._id },
                { recipient: req.user._id }
            ]
        };

        const donations = await Donation.find(query)
            .populate('donor', 'name organization phone email profilePicture')
            .populate('recipient', 'name organization phone email profilePicture')
            .sort('-createdAt');

        res.json({
            success: true,
            donations
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Request pickup (Recipient)
 * @route   POST /api/donations/:id/request
 * @access  Private (Recipient)
 */
export const requestPickup = async (req, res, next) => {
    try {
        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            throw new AppError('Donation not found', 404);
        }

        if (donation.status !== 'pending') {
            throw new AppError('This donation is no longer available', 400);
        }

        donation.status = 'accepted';
        donation.recipient = req.user._id;
        await donation.save();

        // Notify donor
        await createNotification(
            donation.donor,
            'pickup_request',
            'Pickup Requested',
            `${req.user.name} from ${req.user.organization || 'NGO'} has requested to pick up your donation.`,
            donation._id
        );

        // Emit socket update to donor
        emitDonationUpdate(donation.donor.toString(), donation);

        res.json({
            success: true,
            donation
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Mark donation as completed
 * @route   POST /api/donations/:id/complete
 * @access  Private
 */
export const completeDonation = async (req, res, next) => {
    try {
        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            throw new AppError('Donation not found', 404);
        }

        // Only donor or assigned recipient can complete
        if (donation.donor.toString() !== req.user._id.toString() &&
            donation.recipient?.toString() !== req.user._id.toString()) {
            throw new AppError('Unauthorized', 401);
        }

        donation.status = 'completed';
        donation.completedAt = new Date();
        await donation.save();

        // Notify other party
        const notifyId = req.user.userType === 'donor' ? donation.recipient : donation.donor;

        if (notifyId) {
            await createNotification(
                notifyId,
                'pickup_completed',
                'Donation Completed',
                'Your food donation transaction has been marked as completed. Thank you!',
                donation._id
            );
            emitDonationUpdate(notifyId.toString(), donation);
        }

        res.json({
            success: true,
            donation
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Cancel donation
 * @route   DELETE /api/donations/:id
 * @access  Private (Donor)
 */
export const cancelDonation = async (req, res, next) => {
    try {
        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            throw new AppError('Donation not found', 404);
        }

        if (donation.donor.toString() !== req.user._id.toString()) {
            throw new AppError('Unauthorized', 401);
        }

        donation.status = 'cancelled';
        await donation.save();

        // If there was an assigned recipient, notify them
        if (donation.recipient) {
            await createNotification(
                donation.recipient,
                'donation_cancelled',
                'Donation Cancelled',
                'A donation you were scheduled to pick up has been cancelled by the donor.',
                donation._id
            );
            emitDonationUpdate(donation.recipient.toString(), donation);
        }

        res.json({
            success: true,
            message: 'Donation cancelled successfully'
        });
    } catch (error) {
        next(error);
    }
};
