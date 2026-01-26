import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
    donor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    foodType: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: ['cooked_meals', 'packaged_food', 'fruits_vegetables', 'baked_goods', 'other'],
        required: true,
    },
    quantity: {
        value: {
            type: Number,
            required: true,
        },
        unit: {
            type: String,
            enum: ['kg', 'servings', 'plates', 'pieces'],
            required: true,
        },
    },
    description: {
        type: String,
    },
    preparationTime: {
        type: Date,
        required: true,
    },
    expiryTime: {
        type: Date,
        required: true,
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
    contactPhone: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'completed', 'cancelled'],
        default: 'pending',
        index: true,
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    matchedRecipients: [{
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        distance: Number, // in km
    }],
    completedAt: {
        type: Date,
    },
}, {
    timestamps: true,
});

// Create geospatial index for location-based queries
donationSchema.index({ location: '2dsphere' });
donationSchema.index({ status: 1, expiryTime: 1 });

const Donation = mongoose.model('Donation', donationSchema);

export default Donation;
