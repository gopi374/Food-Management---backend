import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    firebaseUid: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    userType: {
        type: String,
        enum: ['donor', 'recipient'],
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phone: {
        type: String,
        required: true,
    },
    organization: {
        type: String,
        required: function () {
            return this.userType === 'recipient';
        },
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true,
        },
    },
    address: {
        type: String,
        required: true,
    },
    profilePicture: {
        type: String,
        default: '',
    },
    // Recipient-specific fields
    isAvailable: {
        type: Boolean,
        default: true,
    },
    capacity: {
        type: Number,
        default: 100, // in kg
    },
}, {
    timestamps: true,
});

// Create geospatial index for location-based queries
userSchema.index({ location: '2dsphere' });

const User = mongoose.model('User', userSchema);

export default User;
