import User from '../models/User.js';
import { AppError } from '../middleware/error.middleware.js';
import { admin } from '../config/firebase.js';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
    try {
        const {
            firebaseUid,
            userType,
            name,
            email,
            phone,
            organization,
            location,
            address,
        } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ firebaseUid }, { email }] });
        if (existingUser) {
            throw new AppError('User already exists', 400);
        }

        // Create user
        const user = await User.create({
            firebaseUid,
            userType,
            name,
            email,
            phone,
            organization,
            location: {
                type: 'Point',
                coordinates: location.coordinates, // [longitude, latitude]
            },
            address,
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: user._id,
                firebaseUid: user.firebaseUid,
                userType: user.userType,
                name: user.name,
                email: user.email,
                phone: user.phone,
                organization: user.organization,
                location: user.location,
                address: user.address,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user profile
 * GET /api/auth/profile
 */
export const getProfile = async (req, res, next) => {
    try {
        res.json({
            success: true,
            user: req.user,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
export const updateProfile = async (req, res, next) => {
    try {
        const { name, phone, organization, address, location, profilePicture } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (organization) updateData.organization = organization;
        if (address) updateData.address = address;
        if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
        if (location) {
            updateData.location = {
                type: 'Point',
                coordinates: location.coordinates,
            };
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Upload profile picture (Avatar)
 * POST /api/auth/upload-avatar
 */
export const uploadAvatar = async (req, res, next) => {
    try {
        if (!req.file) {
            throw new AppError('No file uploaded', 400);
        }

        const bucket = admin.storage().bucket();
        console.log('Attempting upload to bucket:', bucket.name);
        const fileName = `avatars/${req.user.firebaseUid}_${Date.now()}_${req.file.originalname}`;
        const blob = bucket.file(fileName);

        const blobStream = blob.createWriteStream({
            metadata: {
                contentType: req.file.mimetype,
            },
        });

        blobStream.on('error', (err) => {
            console.error('Blob upload error:', err);
            next(err);
        });

        blobStream.on('finish', async () => {
            try {
                // For direct browser access without CORS, we use the public URL
                // Note: makePublic() might fail if the bucket is set to "uniform bucket-level access"
                // but we can also use signed URLs or the standard Firebase URL format.
                await blob.makePublic();

                // Construct public URL
                // Form: https://storage.googleapis.com/[BUCKET]/[FILE]
                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

                // Update user profile in DB
                await User.findByIdAndUpdate(req.user._id, { profilePicture: publicUrl });

                res.json({
                    success: true,
                    profilePicture: publicUrl,
                });
            } catch (err) {
                console.error('Error making file public:', err);
                next(err);
            }
        });

        blobStream.end(req.file.buffer);
    } catch (error) {
        next(error);
    }
};
